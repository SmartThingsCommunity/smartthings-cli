# Overview

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![npm version](https://badge.fury.io/js/%40smartthings%2Fcli.svg)](https://badge.fury.io/js/%40smartthings%2Fcli)
![npm](https://img.shields.io/npm/dm/@smartthings/cli)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

SmartThings CLI
=======================

The SmartThings CLI is a tool to help with developing SmartApps and drivers for the SmartThings ecosystem.

* [Usage](#usage)
* [Helpful Hints](#helpful-hints)
* [Commands](#commands)
* [Configuration and Logging](#configuration-and-logging)

# Usage

## Installation

### Homebrew (MacOS)

```console
brew install smartthingscommunity/smartthings/smartthings
```

### Windows

Download and run the `smartthings.msi` installer from the [latest Release](https://github.com/SmartThingsCommunity/smartthings-cli/releases).

### Standalone Installation (Linux and others)

1. Download the appropriate zipped binary from the [latest Release](https://github.com/SmartThingsCommunity/smartthings-cli/releases).
1. Extract and install it on your system path. It does not need administrator privileges but will need to be executable.

### Other

The CLI can be used on any platform that supports Node 24.

First, install at least [Node version 24.8.0](https://nodejs.org/en/download/current) on your machine.
The official Node release can be found here:

https://nodejs.org/en/download/current

Then, install the CLI.

```console
npm install --global @smartthings/cli
```

## Verify Installation

Run `smartthings --version` and verify the version matches the latest release.

## Getting Started

1. Run `smartthings --help` to get more information on each command.
1. Run a specific command with `smartthings <command>`.

## Input and Output Considerations

Many commands in the CLI handle complex input and/or output, mostly for use with
the SmartThings REST API.

Complex input can always be passed as JSON or YAML and in a couple cases a "question and answer"
mode is provided.

The output format will match the input format unless otherwise specified. When there is no input
specified the default will be a user-friendly (often table) formatted style if the output is
going to the console or JSON otherwise.

| Name | Shortcut | Description |
| -- | -- | -- |
| json | j | Write output in JSON format. |
| yaml | y | Write output in YAML format. |
| indent | | Specify the number of spaces for YAML or JSON output |
| input | i | Specify a filename for input. |
| output | o | Specify a filename for output. The extension of this file will control its type unless overridden with `--json` or `--yaml`. |

## Shell Completions

On MacOS with zsh, run `smartthings generate-completions-script >> ~/.zshrc`. Note that
when running this command, a comment suggests adding to `.zprofile` on MacOS but I found
this did not work for me.

Linux instructions can be found here. These have not been tested yet.

https://yargs.js.org/docs/#api-reference-completioncmd-description-fn

## Authentication

The CLI supports an automatic login flow that pops up a browser window
asking you to log in and give the CLI permission to access your account.
The CLI will automatically request login as needed.

You can also use a personal access token (PAT) for authentication by passing a `--token <uuid>` flag to commands or by creating a
[configuration file](https://github.com/SmartThingsCommunity/smartthings-cli/blob/main/packages/cli/doc/configuration.md)
and including the token in a `token` key for your profile. We generally don't recommend this approach
since it less secure, given that PATs don't expire unless revoked by the user, but it can be useful when working with
headless servers or for users who frequently switch between accounts.

# Helpful Hints

1. You can get more specific information about any command or sub-hierarchy
   of commands by using `--help` with a specific command or branch. For
   example, you can run any of the following commands for varying level of
   detail:
   	* `smartthings capabilities --help`,
   	* `smartthings capabilities:presentation --help`
   	* `smartthings capabilities:presentation:create --help`
1. The CLI accepts data in YAML or JSON format and can
   output data in either format as well as the default table format.
1. Commands that take input accept stdin or a file specified
   by the `--input` (shortcut `-i`) flag.
1. Commands that output data will output the data to stdout unless a file
   is specified the using `--output` (shortcut `-o`) flag.
1. When no output format is specified, the CLI outputs a summary of the most useful information
   in table format. For full details, use `--json` (`-j`) or `--yaml` (`-y`).
1. When a command takes input and results in output, the format of the output
   will match the input format unless an output filename is specified
   using `--output` with a different extension.
1. Command line flags must go after the command. Use `smartthings command -f flag` instead
   of `smartthings -f flag command`.
1. You can [open an issue](https://github.com/SmartThingsCommunity/smartthings-cli/issues/new/choose) to report a bug or ask a question.

# Commands

Commands that use the SmartThings REST API are organized in topics that map to the API spec.

More information can be found using the `--help` flag with any command. For example, to find
details on the `edge:channels:create` command, run:

```console
smartthings edge:channels:create --help
```

<!-- BEGIN: commands -->
<!-- Do not manually this file between the "BEGIN commands" and "END commands" comments. -->
| Command | Description |
| -- | -- |
| apps [id-or-index] | get a specific app or a list of apps |
| apps:authorize <arn> | authorize calls to your AWS Lambda function from SmartThings |
| apps:create | create an app |
| apps:delete [id] | delete an app |
| apps:oauth [id-or-index] | get OAuth information for an app |
| apps:oauth:generate [id] | regenerate the OAuth clientId and clientSecret of an app |
| apps:oauth:update [id] | update the OAuth settings of an app |
| apps:register [id] | send request to app target URL to confirm existence and authorize lifecycle events |
| apps:settings [id-or-index] | get the settings of an app |
| apps:settings:update [id] | update the settings of an app |
| apps:update [id] | update the settings of the app |
| capabilities [id-or-index] | get a specific capability or a list of capabilities |
| capabilities:create | create a capability |
| capabilities:delete [id] | delete a capability |
| capabilities:update [id] | update a capability |
| capabilities:namespaces | list all capability namespaces currently available in a user account |
| capabilities:presentation [id-or-index] | get presentation information for a specific capability |
| capabilities:presentation:create [id] | create presentation model for a capability |
| capabilities:presentation:update [id] | update presentation information of a capability |
| capabilities:translations [id-or-index] [tag] | get list of locales supported by the capability |
| capabilities:translations:create [id] | create a capability translation |
| capabilities:translations:update [id] | update a capability translation |
| capabilities:translations:upsert [id] | create or update a capability translation |
| config [name] | list profiles defined in config file |
| config:reset | clear saved answers to questions |
| devicepreferences [id-or-index] | list device preferences or get information for a specific device preference |
| devicepreferences:create | create a device preference |
| devicepreferences:update [id] | update a device preference |
| devicepreferences:translations [preferenceIdOrIndex] [tag] | list locales translated for a device preference or display translations for a specific locale |
| devicepreferences:translations:create [device-preference-id] | create a translation for a device preference |
| devicepreferences:translations:update [id] | update a device preference translation |
| deviceprofiles [id-or-index] | get a specific device profile or a list device profiles |
| deviceprofiles:create | create a new device profile |
| deviceprofiles:delete [id] | delete a device profile |
| deviceprofiles:device-config [id-or-index] | get the device configuration associated with a device profile |
| deviceprofiles:presentation [id-or-index] | get the presentation associated with a device profile |
| deviceprofiles:publish [id] | publish a device profile (published profiles cannot be modified) |
| deviceprofiles:view [id-or-index] | show device profile and device configuration in a single, consolidated view |
| deviceprofiles:translations [profileIdOrIndex] [tag] | list locales translated for a device profile or display translations for a specific locale |
| deviceprofiles:translations:delete [id] [tag] | delete a device profile translation |
| deviceprofiles:translations:upsert [id] | create or update a device profile translation |
| deviceprofiles:update [id-or-index] | update a device profile |
| deviceprofiles:view:create | create a new device profile and device configuration |
| deviceprofiles:view:update [id] | update a device profile and its device configuration |
| devices [id-or-index] | get a list of devices or details of a specific device |
| devices:capability-status [device-id-or-index] [component-id] [capability-id] | get the current status of all of a device capability's attributes |
| devices:component-status [device-id-or-index] [component-id] | get the current status of a device component's attributes |
| devices:commands [id] [command] | execute a device command |
| devices:delete [id] | delete a device |
| devices:health [id-or-index] | get the current health status of a device |
| devices:history [id-or-index] | get device history by device |
| devices:preferences [id-or-index] | get the current preferences of a device |
| devices:presentation [id-or-index] | get a device presentation |
| devices:rename [id] [new-label] | rename a device |
| devices:status [id-or-index] | get the current status of all of a device's component's attributes |
| devices:update [id] | update a device's label and room |
| edge:channels [id-or-index] | list all channels owned by you or retrieve a single channel |
| edge:channels:assign [driver-id] [driver-version] | assign a driver to a channel |
| edge:channels:create | create a channel |
| edge:channels:delete [id] | delete a channel |
| edge:channels:drivers [id-or-index] | list drivers assigned to a given channel |
| edge:channels:enroll [hub-id] | enroll a hub in a channel |
| edge:channels:enrollments [id-or-index] | list all channels a given hub is enrolled in |
| edge:channels:invites [id-or-index] | list invitations or retrieve a single invitation by id or index |
| edge:channels:invites:accept <id> | accept a channel invitation |
| edge:channels:invites:create | create an invitation |
| edge:channels:invites:delete [id] | delete a channel invitation |
| edge:channels:metainfo [driver-id-or-index] | display metadata about drivers assigned to channels |
| edge:channels:unassign [driver-id] | remove a driver from a channel |
| edge:channels:unenroll [hub-id] | unenroll a hub from a channel |
| edge:channels:update [id] | update a channel |
| edge:drivers [id-or-index] | list all drivers owned by you or retrieve a single driver |
| edge:drivers:default [id-or-index] | list default drivers available to all users |
| edge:drivers:delete [id] | delete an edge driver |
| edge:drivers:devices [id-or-index] | list devices using edge drivers |
| edge:drivers:install [driver] | install an edge driver onto a hub |
| edge:drivers:installed [id-or-index] | list all drivers installed on a given hub |
| edge:drivers:logcat [driver-id] | stream logs from installed drivers, simple temporary hard-coded version |
| edge:drivers:package [project-directory] | build and upload an edge package |
| edge:drivers:prune | uninstall unused edge drivers from a hub |
| edge:drivers:switch [device-id] | change the driver used by an installed device |
| edge:drivers:uninstall [driver-id] | uninstall an edge driver from a hub |
| installedapps [id-or-index] | get a specific installed app or a list of installed apps |
| installedapps:delete [id] | delete an installed app |
| installedapps:rename [id] [new-name] | rename an installed app instance |
| installedschema [id-or-index] | get a specific installed schema app or list installed schema apps |
| installedschema:delete [id] | delete an installed Schema App |
| invites:schema [id-or-index] | list invitations for a schema app or display details for an invitation |
| invites:schema:create | create an invitation to a schema app |
| invites:schema:delete [id] | delete a Schema App invitation |
| locations [id-or-index] | list locations or get information for a specific location |
| locations:create | create a location for a user |
| locations:delete [id] | delete a location |
| locations:history [id-or-index] | get history by location |
| locations:update [id] | update a location |
| locations:modes [id-or-index] | list modes or get information for a specific mode |
| locations:modes:create | create a mode |
| locations:modes:delete [id] | delete a mode |
| locations:modes:update [id] | update a mode's label |
| locations:modes:getcurrent [id] | get details of current mode |
| locations:modes:setcurrent [id] | set the current mode |
| locations:rooms [id-or-index] | list rooms or get information for a specific room |
| locations:rooms:create | create a room |
| locations:rooms:delete [id] | delete a room |
| locations:rooms:update [id] | update a room |
| logout | force login next time the specified (or default) profile is used |
| organizations [id-or-index] | get a specific organization or list organizations the user belongs to |
| organizations:current | get the currently active organization |
| presentation <presentationId> [manufacturer-name] | query device presentation by presentation id |
| presentation:device-config <presentationId> [manufacturer-name] | query device config by presentation id |
| presentation:device-config:create | create a device config |
| presentation:device-config:generate <id> | generate the default device configuration |
| rules [id-or-index] | get a specific rule or a list of rules |
| rules:create | create a rule |
| rules:delete [id] | delete a rule |
| rules:execute [id] | execute a rule |
| rules:update [id] | update a rule |
| scenes [id-or-index] | list scenes or get information for a specific scene |
| scenes:execute [id] | execute a scene |
| schema [id-or-index] | list all Schema App links currently available in a user account |
| schema:authorize <arn> | authorize calls to your Schema App AWS Lambda function from SmartThings |
| schema:create | link Schema App to SmartThings |
| schema:delete [id] | unlink a Schema App from smartthings |
| schema:regenerate [id] | regenerate the client id and secret of the Schema App link |
| schema:update [id] | update a link to a Schema App |
| virtualdevices [id-or-index] | list all virtual devices available in a user account or retrieve a single device |
| virtualdevices:create | create a virtual device from a device profile id or definition |
| virtualdevices:create-standard | create a virtual device from one of the standard prototypes |
| virtualdevices:delete [id] | delete a virtual device |
| virtualdevices:events [device-id] [name] [value] [unit] | create events for a virtual device |
| virtualdevices:update [id] | update a virtual device's label and room |
<!-- END: commands -->

# Configuration and Logging

## Enable Debug Logging

Debug logging can be enabled via the `SMARTTHINGS_DEBUG` environment variable. This will log at debug level to the console as well as the default log file.

```console
$ SMARTTHINGS_DEBUG=true smartthings <command>
```

More details about advanced configuration and logging in the CLI can be found on the
[configuration documentation page](https://github.com/SmartThingsCommunity/smartthings-cli/blob/master/packages/cli/doc/configuration.md).
