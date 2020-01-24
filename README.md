# Overview

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
[SmartThings Core JS Library](https://codesamsung.com/iot-sdk/smartthings-core-js.git)
which is not yet published. To get this working for testing purposes, you'll
need to check out both repositories and then:

1. In the SDK, run `npm install`.
1. In the SDK, run `npm run build`.
1. In the SDK, run `npm link`.
1. Install lerna globally with `npm -g i lerna`. (Alternatively, you can use
   `npx lerna` below instead of simply `lerna`.)
1. In the CLI, run `lerna bootstrap`.
1. In the CLI, run `npm install`.
1. In the CLI, run `lerna link`.
1. In the CLI packages/lib directory, run `npm link`.
1. In the CLI directory, run
   `npm link @smartthings/smartthings-core-js`. You may sometimes
   need to re-run this command, especially if you used `npm install` or
   `npm uninstall` in the CLI project at a later time.
1. To compile the CLI, run `lerna run compile` in the root directory of this
   monorepo. Alternatively, use `lerna run watch` to watch for changes and
   compile on the fly.
1. In the CLI packages/cli, run `npm link`. After this you can run the CLI
   using `smartthings`.
