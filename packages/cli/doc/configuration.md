# Configuration

## Overview

The CLI can be configured by creating a YAML file called `config.yaml` in the
following location:

* `$HOME/.config/@smartthings/cli` on MacOS or Linux
* `%LOCALAPPDATA%\@smartthings\cli` on Windows

## Profiles

It's possible to define multiple profiles with different configurations.

* Top-level keys other than the special `logging` key define these profiles.
* The default profile is simply named "default" and will be used unless otherwise
specified. Most users can simply put their configuration options here.
* To choose a different profile you can either set the SMARTTHINGS_PROFILE
environment variable or use the `--profile` (shortcut `-p`) command line
argument. (When both are used, the command line argument overrides the
environment variable.)

[YAML Primer](https://github.com/darvid/trine/wiki/YAML-Primer).

## Configuration Options

The following per-profile config options are supported:

| Option | Default Value | Description |
| -- | -- | -- |
| indent | 2 | Indent level for JSON or YAML output. |
| compactTableOutput | true | Compact table output without lines between rows. |
| token | none | Use a bearer token (such as a PAT) for authentication instead of the default login flow. |

## Example

```yaml
default:
  indent: 4
  compactTableOutput: false

tight:
  indent: 1
  compactTableOutput: true
```

## Logging

Logging is mostly useful when you are developing the CLI itself (rather than
using it).

The CLI uses [log4js](https://log4js-node.github.io/log4js-node/) for logging.

Logging is configured using the `logging` key in the config file. The value of
this key is passed directly to log4js so any valid log4js configuration can
be used here. The following categories are used in the CLI:

* rest-client - This category is used for the SDK that interfaces with the API.
  Turn this on to see detailed information for HTTP calls are made to SmartThings.
* cli - This is the generic logger used by the CLI.

There are other categories and more may be added later.
