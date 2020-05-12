# Overview

NOTE: This CLI is currently considered a pre-alpha release. It has currently
has only a very few specific features implemented and is very much a work in
progress.

This is the monorepo for the SmartThings CLI. Currently, the following
packages are included:

* [cli](packages/cli/README.md) - the CLI itself; @smartthings/cli node package
* [lib](packages/lib/README.md) - a library for use in the CLI and its
  extensions; @smartthings/cli-lib node package
* [testlib](packages/testlib/README.md) - a library for use in the CLI and its
  extensions with utility methods to make testing with Jest easier;
  @smartthings/cli-testlib node package

# Development

The CLI uses lerna to manage multiple packages in a monorepo.

The CLI depends on the
[SmartThings Core SDK](https://github.com/SmartThingsCommunity/smartthings-core-sdk)
which is not yet published. To get this working for testing purposes, you'll
need to check out both repositories and then:

1. Be sure you're using at least NodeJS version 12.
1. In the root directory of the SDK
	1. run `npm install`.
	1. run `npm link`. If you're using a globally-installed version of node,
		you might need to run this with admin privileges.
1. Install lerna globally with `npm -g i lerna`. (Alternatively, you can use
   `npx lerna` below instead of simply `lerna`.)
1. In the in the root directory of the CLI repository run `./bootstrap.sh`.
1. The bootstrap script will compile the CLI but you can:
	1. run `lerna run compile` to compile again, or
	1. run `lerna run watch` to watch for changes and compile on the fly, or
	1. run `lerna run build` to clean and compile
1. To run the CLI, run the `run` command in packages/cli/bin. You can create
   a link to this file to make it easier to run. Since the final installed
   name will be "smartthings", that's a good name for the link. For example:
   `ln -s ~/mydevdir/smartthings-cli/packages/cli/bin/run ~/bin/smartthings`

There is also a `full_clean.sh` script you can run to start over again. This is
sometimes helpful when pulling new code.

Before opening a pull request be sure to:

1. Run eslint via `lerna run lint`
1. Run tests with `lerna run test`
1. If you've added or or removed commands or updated any of their arguments
   or flags, be sure to update the readme. Doing a full build via
   `lerna run build` will do this but you can also run `lerna run readme`.
