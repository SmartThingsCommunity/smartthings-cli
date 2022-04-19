# Configuration

## Overview

The default CLI configuration can be overridden by creating a YAML file called `config.yaml` in the
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

The [YAML Primer](https://github.com/darvid/trine/wiki/YAML-Primer) is a good source of information
on YAML. Note, however, some features (like merge keys) have been removed in 1.2. The YAML parser
we use still supports them, at least for now.

## Configuration Options

The following per-profile config options are supported:

| Option | Default Value | Description |
| -- | -- | -- |
| indent | 2 | Indent level for JSON or YAML output. |
| compactTableOutput | true | Compact table output without lines between rows. |
| organization | none | UUID of the organization to use in applicable CLI commands. |
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

## On the Command Line

These command line options are hidden from the README and help to reduce clutter since they are
rarely used. (Configuring them via the configuration options above is usually more useful.)
Command line flags always override configuration options.

| option | description |
| -- | -- |
| `--expanded` | Expanded table output with lines between rows. |
| `--compact` | Compact table output without lines between rows. |
| `--indent=<value>` | Indent level for JSON or YAML output. |

## Logging

Logging is useful when you are developing the CLI itself or if you need to debug an issue experienced during general use.

By default, a rolling log file will be created at the [OCLIF CLI cache](https://oclif.io/docs/config) directory.
* macOS: `~/Library/Caches/@smartthings/cli`
* Unix: `~/.cache/@smartthings/cli`
* Windows: `%LOCALAPPDATA%\@smartthings\cli`

The CLI uses [log4js](https://log4js-node.github.io/log4js-node/) for logging.

Logging can be configured using a YAML file called `logging.yaml` in the same
location as the config file mentioned above. The contents of this file are
passed directly to log4js (overriding any default behavior) so any valid log4js configuration can be included
here. The following log categories are used in the CLI:

* `cli` - Generic logger used by the CLI. Log entries will have the command name appended. (ex. `cli.DriversCommand`)
* `rest-client` - Used for the SDK that interfaces with the SmartThings API.
* `login-authenticator` - Used in the default OAuth login flow.
