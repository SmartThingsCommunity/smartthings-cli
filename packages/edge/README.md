SmartThings Edge CLI Plugin
===========================

This is the home of the SmartThings CLI plugin for Edge Drivers. While it is a plugin with a
separate code base, it is installed by default with the SmartThings CLI. No additional setup is
necessary to begin using the Edge CLI plugin with the SmartThings CLI.


<!-- toc -->
* [Using](#using)
* [Commands](#commands)
* [Building](#building)
<!-- tocstop -->

# Using

See the [README for the CLI](https://github.com/SmartThingsCommunity/smartthings-cli/blob/master/packages/cli/README.md)
for information on running the CLI.

# Commands

<!-- commands -->
* [`smartthings edge`](#smartthings-edge)
* [`smartthings edge:channels [IDORINDEX]`](#smartthings-edgechannels-idorindex)
* [`smartthings edge:channels:assign [DRIVERID] [VERSION]`](#smartthings-edgechannelsassign-driverid-version)
* [`smartthings edge:channels:create`](#smartthings-edgechannelscreate)
* [`smartthings edge:channels:delete [ID]`](#smartthings-edgechannelsdelete-id)
* [`smartthings edge:channels:drivers [IDORINDEX]`](#smartthings-edgechannelsdrivers-idorindex)
* [`smartthings edge:channels:enroll [HUBID]`](#smartthings-edgechannelsenroll-hubid)
* [`smartthings edge:channels:enrollments [IDORINDEX]`](#smartthings-edgechannelsenrollments-idorindex)
* [`smartthings edge:channels:invites [IDORINDEX]`](#smartthings-edgechannelsinvites-idorindex)
* [`smartthings edge:channels:invites:accept ID`](#smartthings-edgechannelsinvitesaccept-id)
* [`smartthings edge:channels:invites:create`](#smartthings-edgechannelsinvitescreate)
* [`smartthings edge:channels:invites:delete [ID]`](#smartthings-edgechannelsinvitesdelete-id)
* [`smartthings edge:channels:metainfo [IDORINDEX]`](#smartthings-edgechannelsmetainfo-idorindex)
* [`smartthings edge:channels:unassign [DRIVERID]`](#smartthings-edgechannelsunassign-driverid)
* [`smartthings edge:channels:unenroll [HUBID]`](#smartthings-edgechannelsunenroll-hubid)
* [`smartthings edge:channels:update [ID]`](#smartthings-edgechannelsupdate-id)
* [`smartthings edge:drivers [IDORINDEX]`](#smartthings-edgedrivers-idorindex)
* [`smartthings edge:drivers:default`](#smartthings-edgedriversdefault)
* [`smartthings edge:drivers:delete [ID]`](#smartthings-edgedriversdelete-id)
* [`smartthings edge:drivers:install [DRIVERID]`](#smartthings-edgedriversinstall-driverid)
* [`smartthings edge:drivers:installed [IDORINDEX]`](#smartthings-edgedriversinstalled-idorindex)
* [`smartthings edge:drivers:logcat [DRIVERID]`](#smartthings-edgedriverslogcat-driverid)
* [`smartthings edge:drivers:package [PROJECTDIRECTORY]`](#smartthings-edgedriverspackage-projectdirectory)
* [`smartthings edge:drivers:switch [DEVICEID]`](#smartthings-edgedriversswitch-deviceid)
* [`smartthings edge:drivers:uninstall [DRIVERID]`](#smartthings-edgedriversuninstall-driverid)

## `smartthings edge`

edge topic

```
USAGE
  $ smartthings edge [-h]

COMMON FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  edge topic
```

_See code: [src/commands/edge.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge.ts)_

## `smartthings edge:channels [IDORINDEX]`

list all channels owned by you or retrieve a single channel

```
USAGE
  $ smartthings edge:channels [IDORINDEX] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-j]
    [-y] [-o <value>] [-I | -A] [--subscriber-id <value> --subscriber-type HUB]

ARGUMENTS
  IDORINDEX  the channel id or number in list

FLAGS
  -A, --all-organizations     include entities from all organizations the user belongs to
  -I, --include-read-only     include subscribed-to channels as well as owned channels
  -O, --organization=<value>  the organization ID to use for this command
  --subscriber-id=<UUID>      filter results based on subscriber id (e.g. hub id)
  --subscriber-type=<option>  filter results based on subscriber type
                              <options: HUB>

COMMON FLAGS
  -h, --help             Show CLI help.
  -j, --json             use JSON format of input and/or output
  -o, --output=<value>   specify output file
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  -y, --yaml             use YAML format of input and/or output
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  list all channels owned by you or retrieve a single channel

EXAMPLES
  # list all user-owned channels
  $ smartthings edge:channels
  # list user-owned and subscribed channels
  $ smartthings edge:channels --include-read-only

  # display details about the second channel listed when running "smartthings edge:channels"
  $ smartthings edge:channels 2
  # display channels subscribed to by the specified hub
  $ smartthings edge:channels --subscriber-type HUB --subscriber-id <hub-id>
```

_See code: [src/commands/edge/channels.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/channels.ts)_

## `smartthings edge:channels:assign [DRIVERID] [VERSION]`

assign a driver to a channel

```
USAGE
  $ smartthings edge:channels:assign [DRIVERID] [VERSION] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>]
    [-C <value>]

ARGUMENTS
  DRIVERID  driver id
  VERSION   driver version

FLAGS
  -C, --channel=<UUID>        channel id
  -O, --organization=<value>  the organization ID to use for this command

COMMON FLAGS
  -h, --help             Show CLI help.
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  assign a driver to a channel
```

_See code: [src/commands/edge/channels/assign.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/channels/assign.ts)_

## `smartthings edge:channels:create`

create a channel

```
USAGE
  $ smartthings edge:channels:create [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-j] [-y] [-i
    <value>] [-o <value>] [-d]

FLAGS
  -O, --organization=<value>  the organization ID to use for this command
  -d, --dry-run               produce JSON but don't actually submit

COMMON FLAGS
  -h, --help             Show CLI help.
  -i, --input=<value>    specify input file
  -j, --json             use JSON format of input and/or output
  -o, --output=<value>   specify output file
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  -y, --yaml             use YAML format of input and/or output
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  create a channel
```

_See code: [src/commands/edge/channels/create.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/channels/create.ts)_

## `smartthings edge:channels:delete [ID]`

delete a channel

```
USAGE
  $ smartthings edge:channels:delete [ID] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>]

ARGUMENTS
  ID  channel id

FLAGS
  -O, --organization=<value>  the organization ID to use for this command

COMMON FLAGS
  -h, --help             Show CLI help.
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  delete a channel
```

_See code: [src/commands/edge/channels/delete.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/channels/delete.ts)_

## `smartthings edge:channels:drivers [IDORINDEX]`

list all drivers assigned to a given channel

```
USAGE
  $ smartthings edge:channels:drivers [IDORINDEX] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-j]
    [-y] [-o <value>]

ARGUMENTS
  IDORINDEX  the channel id or number in list

FLAGS
  -O, --organization=<value>  the organization ID to use for this command

COMMON FLAGS
  -h, --help             Show CLI help.
  -j, --json             use JSON format of input and/or output
  -o, --output=<value>   specify output file
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  -y, --yaml             use YAML format of input and/or output
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  list all drivers assigned to a given channel
```

_See code: [src/commands/edge/channels/drivers.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/channels/drivers.ts)_

## `smartthings edge:channels:enroll [HUBID]`

enroll a hub in a channel

```
USAGE
  $ smartthings edge:channels:enroll [HUBID] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-C
  <value>]

ARGUMENTS
  HUBID  hub id

FLAGS
  -C, --channel=<UUID>        channel id
  -O, --organization=<value>  the organization ID to use for this command

COMMON FLAGS
  -h, --help             Show CLI help.
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  enroll a hub in a channel
```

_See code: [src/commands/edge/channels/enroll.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/channels/enroll.ts)_

## `smartthings edge:channels:enrollments [IDORINDEX]`

list all channels a given hub is enrolled in

```
USAGE
  $ smartthings edge:channels:enrollments [IDORINDEX] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-j]
    [-y] [-o <value>]

ARGUMENTS
  IDORINDEX  the hub id or number in list

FLAGS
  -O, --organization=<value>  the organization ID to use for this command

COMMON FLAGS
  -h, --help             Show CLI help.
  -j, --json             use JSON format of input and/or output
  -o, --output=<value>   specify output file
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  -y, --yaml             use YAML format of input and/or output
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  list all channels a given hub is enrolled in
```

_See code: [src/commands/edge/channels/enrollments.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/channels/enrollments.ts)_

## `smartthings edge:channels:invites [IDORINDEX]`

list invitations or retrieve a single invitation by id or index

```
USAGE
  $ smartthings edge:channels:invites [IDORINDEX] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-j]
    [-y] [-o <value>] [-C <value>]

ARGUMENTS
  IDORINDEX  the invitation id or number in list

FLAGS
  -C, --channel=<UUID>        channel id
  -O, --organization=<value>  the organization ID to use for this command

COMMON FLAGS
  -h, --help             Show CLI help.
  -j, --json             use JSON format of input and/or output
  -o, --output=<value>   specify output file
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  -y, --yaml             use YAML format of input and/or output
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  list invitations or retrieve a single invitation by id or index

EXAMPLES
  $ smartthings edge:channels:invites                  # list all invites on all channels you own

  $ smartthings edge:channels:invites 2                # list details about the second invite show when listed as in the example above

  $ smartthings edge:channels:invites -C <channel id>  # list all invites on channel with id <channel id>

  $ smartthings edge:channels:invites <invite id>      # list details about the invite with id <invite id>
```

_See code: [src/commands/edge/channels/invites.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/channels/invites.ts)_

## `smartthings edge:channels:invites:accept ID`

accept a channel invitation

```
USAGE
  $ smartthings edge:channels:invites:accept [ID] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>]

ARGUMENTS
  ID  invite UUID

FLAGS
  -O, --organization=<value>  the organization ID to use for this command

COMMON FLAGS
  -h, --help             Show CLI help.
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  accept a channel invitation
```

_See code: [src/commands/edge/channels/invites/accept.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/channels/invites/accept.ts)_

## `smartthings edge:channels:invites:create`

create an invitation

```
USAGE
  $ smartthings edge:channels:invites:create [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-C <value> | -i
    <value>] [-j] [-y] [-o <value>] [-d]

FLAGS
  -C, --channel=<UUID>        channel id
  -O, --organization=<value>  the organization ID to use for this command
  -d, --dry-run               produce JSON but don't actually submit

COMMON FLAGS
  -h, --help             Show CLI help.
  -i, --input=<value>    specify input file
  -j, --json             use JSON format of input and/or output
  -o, --output=<value>   specify output file
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  -y, --yaml             use YAML format of input and/or output
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  create an invitation
```

_See code: [src/commands/edge/channels/invites/create.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/channels/invites/create.ts)_

## `smartthings edge:channels:invites:delete [ID]`

delete a channel invitation

```
USAGE
  $ smartthings edge:channels:invites:delete [ID] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-C
  <value>]

ARGUMENTS
  ID  invitation UUID

FLAGS
  -C, --channel=<UUID>        channel id
  -O, --organization=<value>  the organization ID to use for this command

COMMON FLAGS
  -h, --help             Show CLI help.
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  delete a channel invitation
```

_See code: [src/commands/edge/channels/invites/delete.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/channels/invites/delete.ts)_

## `smartthings edge:channels:metainfo [IDORINDEX]`

list all channels owned by you or retrieve a single channel

```
USAGE
  $ smartthings edge:channels:metainfo [IDORINDEX] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-j]
    [-y] [-o <value>] [-C <value> | ]

ARGUMENTS
  IDORINDEX  the channel id or number in list

FLAGS
  -C, --channel=<UUID>        channel id
  -O, --organization=<value>  the organization ID to use for this command

COMMON FLAGS
  -h, --help             Show CLI help.
  -j, --json             use JSON format of input and/or output
  -o, --output=<value>   specify output file
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  -y, --yaml             use YAML format of input and/or output
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  list all channels owned by you or retrieve a single channel

EXAMPLES
  # summarize metainfo for all drivers in a channel
  $ smartthings edge:channels:metainfo
  # summarize metainfo for all drivers in the specified channel
  $ smartthings edge:channels:metainfo -C b50c0aa1-d9ea-4005-8db8-0cf9c2d9d7b2
  # display metainfo about the third driver listed in the above command
  $ smartthings edge:channels:metainfo -C b50c0aa1-d9ea-4005-8db8-0cf9c2d9d7b2 3

  # display metainfo about a driver by using its id

    $ smartthings edge:channels:metainfo -C b50c0aa1-d9ea-4005-8db8-0cf9c2d9d7b2 \
      699c7308-8c72-4363-9571-880d0f5cc725
```

_See code: [src/commands/edge/channels/metainfo.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/channels/metainfo.ts)_

## `smartthings edge:channels:unassign [DRIVERID]`

remove a driver from a channel

```
USAGE
  $ smartthings edge:channels:unassign [DRIVERID] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-C
    <value>]

ARGUMENTS
  DRIVERID  driver id

FLAGS
  -C, --channel=<UUID>        channel id
  -O, --organization=<value>  the organization ID to use for this command

COMMON FLAGS
  -h, --help             Show CLI help.
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  remove a driver from a channel
```

_See code: [src/commands/edge/channels/unassign.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/channels/unassign.ts)_

## `smartthings edge:channels:unenroll [HUBID]`

unenroll a hub from a channel

```
USAGE
  $ smartthings edge:channels:unenroll [HUBID] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-C
  <value>]

ARGUMENTS
  HUBID  hub id

FLAGS
  -C, --channel=<UUID>        channel id
  -O, --organization=<value>  the organization ID to use for this command

COMMON FLAGS
  -h, --help             Show CLI help.
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  unenroll a hub from a channel
```

_See code: [src/commands/edge/channels/unenroll.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/channels/unenroll.ts)_

## `smartthings edge:channels:update [ID]`

update a channel

```
USAGE
  $ smartthings edge:channels:update [ID] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-j] [-y] [-i
    <value>] [-o <value>] [-d]

ARGUMENTS
  ID  the channel id

FLAGS
  -O, --organization=<value>  the organization ID to use for this command
  -d, --dry-run               produce JSON but don't actually submit

COMMON FLAGS
  -h, --help             Show CLI help.
  -i, --input=<value>    specify input file
  -j, --json             use JSON format of input and/or output
  -o, --output=<value>   specify output file
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  -y, --yaml             use YAML format of input and/or output
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  update a channel
```

_See code: [src/commands/edge/channels/update.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/channels/update.ts)_

## `smartthings edge:drivers [IDORINDEX]`

list all drivers owned by you or retrieve a single driver

```
USAGE
  $ smartthings edge:drivers [IDORINDEX] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-j]
    [-y] [-o <value>] [-A] [-V <value>]

ARGUMENTS
  IDORINDEX  the driver id or number in list

FLAGS
  -A, --all-organizations     include entities from all organizations the user belongs to
  -O, --organization=<value>  the organization ID to use for this command
  -V, --version=<value>       driver version

COMMON FLAGS
  -h, --help             Show CLI help.
  -j, --json             use JSON format of input and/or output
  -o, --output=<value>   specify output file
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  -y, --yaml             use YAML format of input and/or output
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  list all drivers owned by you or retrieve a single driver

  Use this command to list all drivers you own, even if they are not yet assigned to a channel.

  See also:

  edge:drivers:installed to list installed drivers

  edge:channels:drivers to list drivers that are part of a channel you own or have subscribed to

EXAMPLES
  # list all user-owned drivers
  $ smartthings edge:drivers
  # display details about the third driver listed in the above command
  $ smartthings edge:drivers 3

  # display details about a driver by using its id
  $ smartthings edge:drivers 699c7308-8c72-4363-9571-880d0f5cc725
  # get information on a specific version of a driver
  $ smartthings edge:drivers 699c7308-8c72-4363-9571-880d0f5cc725 --version 2021-10-25T00:48:23.295969
```

_See code: [src/commands/edge/drivers.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/drivers.ts)_

## `smartthings edge:drivers:default`

list default drivers available to all users

```
USAGE
  $ smartthings edge:drivers:default [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-j] [-y] [-o
    <value>]

FLAGS
  -O, --organization=<value>  the organization ID to use for this command

COMMON FLAGS
  -h, --help             Show CLI help.
  -j, --json             use JSON format of input and/or output
  -o, --output=<value>   specify output file
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  -y, --yaml             use YAML format of input and/or output
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  list default drivers available to all users

EXAMPLES
  # list default drivers

    $ smartthings edge:drivers:default
```

_See code: [src/commands/edge/drivers/default.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/drivers/default.ts)_

## `smartthings edge:drivers:delete [ID]`

delete an edge driver

```
USAGE
  $ smartthings edge:drivers:delete [ID] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>]

ARGUMENTS
  ID  driver UUID

FLAGS
  -O, --organization=<value>  the organization ID to use for this command

COMMON FLAGS
  -h, --help             Show CLI help.
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  delete an edge driver
```

_See code: [src/commands/edge/drivers/delete.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/drivers/delete.ts)_

## `smartthings edge:drivers:install [DRIVERID]`

install an edge driver onto a hub

```
USAGE
  $ smartthings edge:drivers:install [DRIVERID] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-H
    <value>] [-C <value>]

ARGUMENTS
  DRIVERID  id of driver to install

FLAGS
  -C, --channel=<UUID>        channel id
  -H, --hub=<UUID>            hub id
  -O, --organization=<value>  the organization ID to use for this command

COMMON FLAGS
  -h, --help             Show CLI help.
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  install an edge driver onto a hub

EXAMPLES
  $ smartthings edge:drivers:install                                         # use Q&A format to enter required values

  $ smartthings edge:drivers:install -H <hub-id>                             # specify the hub on the command line, other fields will be asked for

  $ smartthings edge:drivers:install -H <hub-id> -C <channel-id> <driver-id> # install a driver from a channel on an enrolled hub
```

_See code: [src/commands/edge/drivers/install.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/drivers/install.ts)_

## `smartthings edge:drivers:installed [IDORINDEX]`

list all drivers installed on a given hub

```
USAGE
  $ smartthings edge:drivers:installed [IDORINDEX] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-j]
    [-y] [-o <value>] [-H <value>] [--device <value>] [-v]

ARGUMENTS
  IDORINDEX  the driver id or number in list

FLAGS
  -H, --hub=<UUID>            hub id
  -O, --organization=<value>  the organization ID to use for this command
  -v, --verbose               include channel name in output
  --device=<UUID>             return drivers matching the specified device

COMMON FLAGS
  -h, --help             Show CLI help.
  -j, --json             use JSON format of input and/or output
  -o, --output=<value>   specify output file
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  -y, --yaml             use YAML format of input and/or output
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  list all drivers installed on a given hub

EXAMPLES
  list all installed drivers

    $ smartthings edge:drivers:installed

  list all installed drivers and include the channel name in the output

    $ smartthings edge:drivers:installed --verbose

  list the first driver in the list retrieved by running "smartthings edge:drivers:installed"

    $ smartthings edge:drivers:installed 1

  list an installed driver by id

    $ smartthings edge:drivers:installed <driver-id>
```

_See code: [src/commands/edge/drivers/installed.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/drivers/installed.ts)_

## `smartthings edge:drivers:logcat [DRIVERID]`

stream logs from installed drivers

```
USAGE
  $ smartthings edge:drivers:logcat [DRIVERID] [-h] [-p <value>] [-t <value>] [--language <value>] [-a] [--hub-address
    <value>] [--connect-timeout <value>] [--log-level <value>]

ARGUMENTS
  DRIVERID  a specific driver to stream logs from

FLAGS
  -a, --all                         stream from all installed drivers
  --connect-timeout=<milliseconds>  [default: 30000] max time allowed when connecting to hub
  --hub-address=<value>             IPv4 address of hub with optionally appended port number
  --log-level=<string>              [default: TRACE] minimum level of event to log

COMMON FLAGS
  -h, --help             Show CLI help.
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  stream logs from installed drivers
```

_See code: [src/commands/edge/drivers/logcat.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/drivers/logcat.ts)_

## `smartthings edge:drivers:package [PROJECTDIRECTORY]`

build and upload an edge package

```
USAGE
  $ smartthings edge:drivers:package [PROJECTDIRECTORY] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>]
    [-j] [-y] [-o <value>] [-a | --channel <value> | [-b <value> | -u <value>]] [-I | --hub <value> | ]

ARGUMENTS
  PROJECTDIRECTORY  [default: .] directory containing project to upload

FLAGS
  -I, --install               prompt for hub to install to after assigning it to the channel, implies --assign if
                              --assign or --channel not included
  -O, --organization=<value>  the organization ID to use for this command
  -a, --assign                prompt for a channel to assign the driver to after upload
  -b, --build-only=<value>    save package to specified zip file but skip upload
  -u, --upload=<value>        upload zip file previously built with --build flag
  --channel=<UUID>            automatically assign driver to specified channel after upload
  --hub=<UUID>                automatically install driver to specified hub, implies --assign if --assign or --channel
                              not included

COMMON FLAGS
  -h, --help             Show CLI help.
  -j, --json             use JSON format of input and/or output
  -o, --output=<value>   specify output file
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  -y, --yaml             use YAML format of input and/or output
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  build and upload an edge package

EXAMPLES
  # build and upload driver found in current directory:
  $ smartthings edge:drivers:package
  # build and upload driver found in current directory, assign it to a channel, and install it;
  # user will be prompted for channel and hub
  $ smartthings edge:drivers:package -I
  # build and upload driver found in current directory then assign it to the specified channel
  # and install it to the specified hub
  $ smartthings edge:drivers:package --channel <channel-id> --hub <hubId>
  # build and upload driver found in the my-driver directory
  $ smartthings edge:drivers:package my-driver
  # build the driver in the my-package directory and save it as driver.zip
  $ smartthings edge:drivers:package -b driver.zip my-package

  # upload the previously built driver found in driver.zip

    $ smartthings edge:drivers:package -u driver.zip
```

_See code: [src/commands/edge/drivers/package.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/drivers/package.ts)_

## `smartthings edge:drivers:switch [DEVICEID]`

change the driver used by an installed device

```
USAGE
  $ smartthings edge:drivers:switch [DEVICEID] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-H
    <value>] [-d <value>] [-I]

ARGUMENTS
  DEVICEID  id of device to update

FLAGS
  -H, --hub=<UUID>            hub id
  -I, --include-non-matching  when presenting a list of drivers to switch to, include drivers that do not match the
                              device
  -O, --organization=<value>  the organization ID to use for this command
  -d, --driver=<UUID>         id of new driver to use

COMMON FLAGS
  -h, --help             Show CLI help.
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  change the driver used by an installed device

EXAMPLES
  # switch driver, prompting user for all necessary input
  $ smartthings edge:drivers:switch
  # switch driver, including all necessary input on the command line
  $ smartthings edge:drivers:switch --hub <hub-id> --driver <driver-id> <device-id>

  # include all available drivers in prompt, even if they don't match the chosen device

    $ smartthings edge:drivers:switch --include-non-matching
```

_See code: [src/commands/edge/drivers/switch.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/drivers/switch.ts)_

## `smartthings edge:drivers:uninstall [DRIVERID]`

uninstall an edge driver from a hub

```
USAGE
  $ smartthings edge:drivers:uninstall [DRIVERID] [-h] [-p <value>] [-t <value>] [--language <value>] [-O <value>] [-H
    <value>]

ARGUMENTS
  DRIVERID  id of driver to uninstall

FLAGS
  -H, --hub=<UUID>            hub id
  -O, --organization=<value>  the organization ID to use for this command

COMMON FLAGS
  -h, --help             Show CLI help.
  -p, --profile=<value>  [default: default] configuration profile
  -t, --token=<value>    the auth token to use
  --language=<value>     ISO language code or "NONE" to not specify a language. Defaults to the OS locale

DESCRIPTION
  uninstall an edge driver from a hub
```

_See code: [src/commands/edge/drivers/uninstall.ts](https://github.com/SmartThingsCommunity/smartthings-cli/blob/@smartthings/plugin-cli-edge@2.0.0/packages/edge/src/commands/edge/drivers/uninstall.ts)_
<!-- commandsstop -->

# Building

If you're a developer planning to work on the plugin, you can build and install
it this way.

## Prerequisites

* Node version 12 or later
* The latest release of the [SmartThings CLI](https://github.com/SmartThingsCommunity/smartthings-cli/blob/master/packages/cli/README.md)

## Building

1. npm install
1. npm run build

## Using Your Developer Build

Install the plugin by linking it:

    smartthings plugins:link ~path/to/this/repo
