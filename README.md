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
* [`smartthings autocomplete [SHELL]`](#smartthings-autocomplete-shell)
* [`smartthings config [FILE]`](#smartthings-config-file)
* [`smartthings devices ID`](#smartthings-devices-id)
* [`smartthings devices:capabilities-status [FILE]`](#smartthings-devicescapabilities-status-file)
* [`smartthings devices:commands ID`](#smartthings-devicescommands-id)
* [`smartthings devices:components-status ID COMPONENTID`](#smartthings-devicescomponents-status-id-componentid)
* [`smartthings devices:list`](#smartthings-deviceslist)
* [`smartthings devices:status ID`](#smartthings-devicesstatus-id)
* [`smartthings generate:java`](#smartthings-generatejava)
* [`smartthings generate:node`](#smartthings-generatenode)
* [`smartthings help [COMMAND]`](#smartthings-help-command)

## `smartthings autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ smartthings autocomplete [SHELL]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

EXAMPLES
  $ smartthings autocomplete
  $ smartthings autocomplete bash
  $ smartthings autocomplete zsh
  $ smartthings autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v0.1.4/src/commands/autocomplete/index.ts)_

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

## `smartthings devices ID`

get device's description

```
USAGE
  $ smartthings devices ID

ARGUMENTS
  ID  the device id

OPTIONS
  -E, --target-environment=target-environment  target environment
  -h, --help                                   show CLI help
  -p, --profile=profile                        [default: default] configuration profile
  -t, --token=token                            the auth token to use
```

_See code: [src/commands/devices.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/v0.0.0/src/commands/devices.ts)_

## `smartthings devices:capabilities-status [FILE]`

get the current status of a device component's capability

```
USAGE
  $ smartthings devices:capabilities-status ID COMPONENTID CAPABILITYID

ARGUMENTS
  ID           the device id
  COMPONENTID  the component id
  CAPABILITYID  the capability id

OPTIONS
  -E, --target-environment=target-environment  target environment
  -h, --help                                   show CLI help
  -p, --profile=profile                        [default: default] configuration profile
  -t, --token=token                            the auth token to use
```

_See code: [src/commands/devices/capabilities-status.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/v0.0.0/src/commands/devices/capabilities-status.ts)_

## `smartthings devices:commands ID`

execute commands on a device

```
USAGE
  $ smartthings devices:commands ID

ARGUMENTS
  ID  the device on which you want to execute a command

OPTIONS
  -E, --target-environment=target-environment  target environment
  -d, --data=data                              JSON data for command(s)
  -h, --help                                   show CLI help
  -p, --profile=profile                        [default: default] configuration profile
  -t, --token=token                            the auth token to use
```

_See code: [src/commands/devices/commands.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/v0.0.0/src/commands/devices/commands.ts)_

## `smartthings devices:components-status ID COMPONENTID`

get the status of all attributes of a the component

```
USAGE
  $ smartthings devices:components-status ID COMPONENTID

ARGUMENTS
  ID           the device id
  COMPONENTID  the component id

OPTIONS
  -E, --target-environment=target-environment  target environment
  -h, --help                                   show CLI help
  -p, --profile=profile                        [default: default] configuration profile
  -t, --token=token                            the auth token to use
```

_See code: [src/commands/devices/components-status.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/v0.0.0/src/commands/devices/components-status.ts)_

## `smartthings devices:list`

get a list of devices

```
USAGE
  $ smartthings devices:list

OPTIONS
  -C, --capabilities-mode=and|or               Treat capability filter query params as a logical "or" or "and" with a
                                               default of "and".

  -E, --target-environment=target-environment  target environment

  -c, --capability=capability                  filter results by capability

  -d, --device-id=device-id                    filter results by device

  -h, --help                                   show CLI help

  -l, --location-id=location-id                filter results by location

  -p, --profile=profile                        [default: default] configuration profile

  -t, --token=token                            the auth token to use
```

_See code: [src/commands/devices/list.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/v0.0.0/src/commands/devices/list.ts)_

## `smartthings devices:status ID`

get the current status of all of a device's component's attributes

```
USAGE
  $ smartthings devices:status ID

ARGUMENTS
  ID  the device id

OPTIONS
  -E, --target-environment=target-environment  target environment
  -h, --help                                   show CLI help
  -p, --profile=profile                        [default: default] configuration profile
  -t, --token=token                            the auth token to use
```

_See code: [src/commands/devices/status.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/v0.0.0/src/commands/devices/status.ts)_

## `smartthings generate:java`

Generate a Java starter app

```
USAGE
  $ smartthings generate:java

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/generate/java.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/v0.0.0/src/commands/generate/java.ts)_

## `smartthings generate:node`

Generate a NodeJS starter app

```
USAGE
  $ smartthings generate:node

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/generate/node.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/v0.0.0/src/commands/generate/node.ts)_

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
