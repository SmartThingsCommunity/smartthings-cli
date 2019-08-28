smartthings-cli
===============

SmartThings unified CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/smartthings-cli.svg)](https://npmjs.org/package/smartthings-cli)
[![CircleCI](https://circleci.com/gh/SmartThingsCommunity/smartthings-cli/tree/master.svg?style=shield)](https://circleci.com/gh/SmartThingsCommunity/smartthings-cli/tree/master)
[![Downloads/week](https://img.shields.io/npm/dw/smartthings-cli.svg)](https://npmjs.org/package/smartthings-cli)
[![License](https://img.shields.io/npm/l/smartthings-cli.svg)](https://github.com/SmartThingsCommunity/smartthings-cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g smartthings-cli
$ smartthings COMMAND
running command...
$ smartthings (-v|--version|version)
smartthings-cli/0.0.0 darwin-x64 node-v11.14.0
$ smartthings --help [COMMAND]
USAGE
  $ smartthings COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`smartthings config [FILE]`](#smartthings-config-file)
* [`smartthings hello [FILE]`](#smartthings-hello-file)
* [`smartthings help [COMMAND]`](#smartthings-help-command)

## `smartthings config [FILE]`

describe the command here

```
USAGE
  $ smartthings config [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src/commands/config.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/v0.0.0/src/commands/config.ts)_

## `smartthings hello [FILE]`

describe the command here

```
USAGE
  $ smartthings hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ smartthings hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/v0.0.0/src/commands/hello.ts)_

## `smartthings help [COMMAND]`

display help for smartthings

```
USAGE
  $ smartthings help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.1/src/commands/help.ts)_
<!-- commandsstop -->
