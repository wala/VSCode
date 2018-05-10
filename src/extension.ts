// import * as path from 'path';

import { LanguageClient, LanguageClientOptions, StreamInfo, RevealOutputChannelOn } from 'vscode-languageclient';
import { Trace } from 'vscode-languageserver-protocol';
import * as vscode from 'vscode';
import * as net from 'net';
import * as child_process from 'child_process';

// Copied from vscode-languageclient/main
declare var v8debug: any;
function startedInDebugMode() {
	let args = process.execArgv;
	if (args) {
		return args.some((arg) => /^--debug=?/.test(arg) || /^--debug-brk=?/.test(arg) || /^--inspect=?/.test(arg) || /^--inspect-brk=?/.test(arg));
	}
	return false;
}

function getDebugState(debugStatus: "on" | "off" | "auto") {
	if (debugStatus === "on") {
		return true;
	} else if (debugStatus === "off") {
		return false;
	} else {
		if (typeof v8debug === 'object' || startedInDebugMode()) {
			return true;
		} else {
			return true;
		}
	}
}

export function activate(context: vscode.ExtensionContext) {

	const ariadneConfiguration = vscode.workspace.getConfiguration("ariadne", vscode.window.activeTextEditor.document.uri);

	// ** Get and validate configuration **

	const javaCommand = ariadneConfiguration.get("java.command", "java");
	const jarPath = ariadneConfiguration.get<string>("server.jar");
	const debugPort: number = ariadneConfiguration.get("debug.port", 8000);
	const debugStatus = ariadneConfiguration.get("debug", "auto" as ("on" | "off" | "auto"));

	let isDebugSuspend: boolean = ariadneConfiguration.get("debug.suspendOnStart", false);
	const outputChannelName: string = ariadneConfiguration.get("trace.output.channel", "Ariadne Channel");
	const walaOutputChannel: vscode.OutputChannel = vscode.window.createOutputChannel(outputChannelName);
	const trace: Trace = Trace.fromString(ariadneConfiguration.get("trace.client", "Off"));
	const isDebug: boolean = getDebugState(debugStatus);


	let serverProcess: child_process.ChildProcess;
	const serverOptions: () => Thenable<StreamInfo> = () => {
		return new Promise((resolve, reject) => {
			const server = net.createServer((socket) => {
				// only allow one connection
				server.close();
				socket.on("data", (message) => {
					console.log(message.toString());
				});
				resolve({
					reader: socket,
					writer: socket
				});
			});

			let vmArgs: string[] = [];

			server.listen(() => {
				const port = (server.address() as net.AddressInfo).port;
				let commandArgs: string[] = ["-jar", jarPath, "--client-port", port.toString()];
				if (isDebug) {
					vmArgs.push("-agentlib:jdwp=transport=dt_socket,server=y,suspend=" + (isDebugSuspend ? "y" : "n") + ",address=" + debugPort);
				}

				const finalArgs: string[] = vmArgs.concat(commandArgs);
				if (trace === Trace.Verbose) {
					walaOutputChannel.appendLine(`Starting the server process as: ${javaCommand} [${finalArgs}]`);
				}
				serverProcess = child_process.spawn(javaCommand, finalArgs);
				if (!serverProcess || !serverProcess.pid) {
					reject(`Launching server using command ${javaCommand} [${finalArgs}] failed.`);
				}
				serverProcess.stderr.on('data', data => walaOutputChannel.append(typeof data === "string" ? data : data.toString()));
				serverProcess.stdout.on('data', data => walaOutputChannel.append("STDOUT: " + (typeof data === "string" ? data : data.toString())));
			});
		});
	};


	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for python documents
		documentSelector: [{ scheme: 'file', language: 'python' }],
		synchronize: {
			// Synchronize the setting section 'languageServerExample' to the server
			configurationSection: 'ariadne',
			// Notify the server about file changes to '.clientrc files contain in the workspace
			fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
		},
		revealOutputChannelOn: RevealOutputChannelOn.Info,
		outputChannel: walaOutputChannel
	};

	// Create the language client and start the client.
	const client = new LanguageClient('ariadne', 'Language Server Client For Ariadne', serverOptions, clientOptions);
	client.trace = trace;

	const disposable = client.start();

	// Push the disposable to the context's subscriptions so that the 
	// client can be deactivated on extension deactivation
	context.subscriptions.push(disposable);
	context.subscriptions.push(new vscode.Disposable(() => {
		if (trace) {
			walaOutputChannel.appendLine("Disposing: Killing the server (pid: " + serverProcess.pid + ")");
		}
		serverProcess.kill();
		walaOutputChannel.dispose();
	}));

	context.subscriptions.push(disposable);

}