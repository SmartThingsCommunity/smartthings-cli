# Configuration

## Overview

The default CLI configuration can be overridden by creating a YAML file called `config.yaml`. The
location of this file varies by operating system. The easiest way to find it is to run `smartthings config`
on your machine and the full filename will be listed.

* `$HOME$/Library/Preferences/@smartthings/cli` on MacOS
* `$HOME/.config/@smartthings/cli` on Linux
* `%LOCALAPPDATA%\@smartthings\cli` on Windows

## Profiles

It's possible to define multiple profiles with different configurations.

* Top-level keys define these profiles.
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
| groupTableOutputRows | true | Separate groups of four rows by a line to make long rows easier to follow across the screen. |
| organization | none | UUID of the organization to use in applicable CLI commands. |
| edgeDriverTestDirs | `['test/**', 'tests/**']` | String or array of strings representing files to skip when building an edge driver package. See below for more details. |
| token | none | Use a bearer token (such as a PAT) for authentication instead of the default login flow. |
| defaultHub | none (see [Default Values](#default-values)) | The default hub to use for edge commands. |
| defaultChannel | none (see [Default Values](#default-values)) | The default channel to use for edge commands. |

## Default Values

When a default value is configured for a hub or a channel, that value is used without question
for most commands that need one (delete commands are an exception). You can configure these default
values yourself by specifying them in your config.yaml file or by answering "Yes" when asked if you
want to make them the default. You can reset all your answers to these questions by running
the `config:reset` command.

## `edgeDriverTestDirs` config option

You can use this option to instruct the CLI to skip files when building an edge driver package. If
you keep your tests in the same directory as your source code (and don't use one of the defaults,
`test` or `tests`, for the base directory of your tests), you should use this to keep them out of
the upload.

You can specify a single string, for example:

```yaml
default:
  edgeDriverTestDirs: specs/**
```

Or, you can specify an array:

```yaml
default:
  edgeDriverTestDirs:
    - specs/**
    - tests/**
```

Files are matched using the `picomatch` library. You find documentation in the
[picomatch README](https://github.com/micromatch/picomatch#basic-globbing) regarding
how to write the matching expressions.

## Example

```yaml
default:
  indent: 4
  groupTableOutputRows: false

tight:
  indent: 1
  groupTableOutputRows: true
```

## On the Command Line

These command line options are hidden from the README and help to reduce clutter since they are
rarely used. (Configuring them via the configuration options above is usually more useful.)
Command line flags always override configuration options.

| option | description |
| -- | -- |
| `--group-rows` | Separate groups of four rows by a line to make long rows easier to follow across the screen. |
| `--no-group-rows` | Do not separate groups of four rows by a line to make long rows easier to follow across the screen. |
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
