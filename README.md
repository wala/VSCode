# Ariadne: WALA based analysis for Machine Learning code written in Python

This extensions provides support for the ariadne tool in vscode.
One day, it will probably be generalized to support using WALA via the LSP.

## Setup

At the moment, some setup is needed to use this plugin.  It has currently only been tested in debug mode.  At some point, we will package a release which will simplify all of this.

At the moment, this has only been tested on a mac.  There is no reason it can't work on other systems as well.

### Dependencies
First, you need to install all the dependencies.
Ensure that you have Java >= 8 installed, as well as maven.

Clone the following repositories:
- https://github.com/wala/WALA
- https://github.com/wala/IDE
- https://github.com/wala/ML

In the wala repo, run `./gradlew publishToMavenLocal`.  Make sure that it succeeds.  Good Luck!
In the IDE repository, go into the `com.ibm.wala.cast.lsp` directory and run `mvn install`.
In the ML repository, run `mvn install`.

In your vscode settings, set
`"ariadne.server.jar"` to the full path to the jar: 
`${PATH-to-ML-repo}/com.ibm.wala.cast.python/target/com.ibm.wala.cast.python-0.0.1-SNAPSHOT.jar"`

In this project, run `npm install` if needed.

open the project in vscode, and try running it under the debugger using the "Extension runner".
You can use the "Debug (attach) ..." runner to debug the java server.

### Configuration settings available:
                                "ariadne.java.command": {
                                        "type":"string",
                                        "default":"java",
                                        "description":"The java executable that will be used to run the server jar."
                                },
                                "ariadne.server.jar": {
                                        "type":"string",
                                        "default":"./lib/ariadne-server.jar",
                                        "description": "The ariadne server jar."
                                },
                                "ariadne.debug": {
                                        "type": "string",
                                         "enum": [
                                                 "on",
                                                 "off",
                                                 "auto"
                                         ],
                                         "default":"auto",
                                         "description": "Should the server start with debugging enabled?  Specifying \"auto\" enables debug mode if the client was started with debugging enabled"
                                },
                                "ariadne.debug.port": {
                                        "type":"number",
                                        "default":8000,
                                        "description": "If the server is started in debug mode, this is the port it will connect on"
                                },
                                "ariadne.debug.suspendOnStart": {
                                        "type":"boolean",
                                        "default":false,
                                        "description": "If the server is started in debug mode, should it suspend on start (until a java debugger attaches to it)?"
                                },
                                "ariadne.trace.server": {
                                        "type": "string",
                                         "enum": [
                                                 "off",
                                                 "messages",
                                                 "debug"
                                         ],
                                         "default":"off",
                                         "description": "What level of the tracing to enable for the client."
                                },
                                "ariadne.trace.client": {
                                        "type": "string",
                                         "enum": [
                                                 "off",
                                                 "messages",
                                                 "debug"
                                         ],
                                         "default":"off",
                                         "description": "What level of the tracing to enable for the server. This value is not currently respected."
                                },
                                "ariadne.trace.output.channel": {
                                        "type": "string",
                                        "default": "Ariadne channel",
                                        "description": "The name of the VSCode output channel that will be used for logging/tracing"
                                }
                        }
                }