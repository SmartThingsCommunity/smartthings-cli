# Change Log

## 1.1.0

### Minor Changes

- [#462](https://github.com/SmartThingsCommunity/smartthings-cli/pull/462) [`b03292d`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/b03292dffcab45dfc8b8fdb915ce5b198824e491) Thanks [@Sitlintac](https://github.com/Sitlintac)! - enable verbose flag when getting a single device

  add helper method to get location and room names for a single item

## 1.0.1

### Patch Changes

- [#448](https://github.com/SmartThingsCommunity/smartthings-cli/pull/448) [`c615772`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/c6157720531cb9383fcf74c4eea607cbf1971770) Thanks [@rossiam](https://github.com/rossiam)! - fixed error handling stdin when not run from the console

- [#453](https://github.com/SmartThingsCommunity/smartthings-cli/pull/453) [`712476c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/712476c0166c030ce94f04bf89a0893f00204bc1) Thanks [@rossiam](https://github.com/rossiam)! - \* Validate saved default values for hubs and channels before using them).
  - Inform the user when a default value is used.
  - Don't use default value for `edge:drivers:install` command.

## 1.0.0

### Patch Changes

- [#293](https://github.com/SmartThingsCommunity/smartthings-cli/pull/293) [`4464873`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/44648732d54093a1e9f842dfb99dfe8bc81ea131) Thanks [@rossiam](https://github.com/rossiam)! - move chooseDevice into lib for use in plugins

- [#309](https://github.com/SmartThingsCommunity/smartthings-cli/pull/309) [`7e3a1b8`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/7e3a1b83d6c301aa86fe35d5660cfadde2bcfaf1) Thanks [@john-u](https://github.com/john-u)! - - shutdown logger before Node exits

  - update @oclif deps to latest
  - replace process exits with command errors

- [#294](https://github.com/SmartThingsCommunity/smartthings-cli/pull/294) [`356a24b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/356a24be75a467f82f627a654dd6a1c8b83c56f8) Thanks [@john-u](https://github.com/john-u)! - Add ability to enable debug logging (to console) via env variable.

- [#398](https://github.com/SmartThingsCommunity/smartthings-cli/pull/398) [`d20ad61`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d20ad6198f663a5ecb04af1d80ccf42d10214fa9) Thanks [@rossiam](https://github.com/rossiam)! - IMPORTANT: removed `-id` suffix from command line flags that had them for consistency

- [#306](https://github.com/SmartThingsCommunity/smartthings-cli/pull/306) [`d4730e0`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d4730e00712ddb18b916295b138301afaa8c23eb) Thanks [@john-u](https://github.com/john-u)! - add debug logging to defualt login authenticator

- [`2ed225f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2ed225f6fd4843aad4550634d49facb87ede7c7d) Thanks [@rossiam](https://github.com/rossiam)! - add config:reset command

- [#274](https://github.com/SmartThingsCommunity/smartthings-cli/pull/274) [`efc1eed`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/efc1eed852a61399342b5040c2d60561bbfb17af) Thanks [@john-u](https://github.com/john-u)! - replace usage of lodash with native ES or separate lodash modules

- [#268](https://github.com/SmartThingsCommunity/smartthings-cli/pull/268) [`a77e73b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a77e73b4348e4a3d65798e2711fbb40ecf0a139d) Thanks [@rossiam](https://github.com/rossiam)! - refactor CLIConfig class into methods and interfaces

- [#297](https://github.com/SmartThingsCommunity/smartthings-cli/pull/297) [`d0fd25d`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d0fd25d12158214c051584a19efb260f938204ce) Thanks [@john-u](https://github.com/john-u)! - parse once from base command

- [#361](https://github.com/SmartThingsCommunity/smartthings-cli/pull/361) [`688082f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/688082fe6d0e12e0e510b5c238de61b46bfddc08) Thanks [@bflorian](https://github.com/bflorian)! - Add userEmail field to ST Schema apps

- [#412](https://github.com/SmartThingsCommunity/smartthings-cli/pull/412) [`e9ff59c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e9ff59ca0f5963d09b7193589762592af61db5e8) Thanks [@rossiam](https://github.com/rossiam)! - refactored `TableGenerator` interface and supporting code

- [#317](https://github.com/SmartThingsCommunity/smartthings-cli/pull/317) [`1e0bae5`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/1e0bae5d33dbb2ca967ab18677616b407baf86fe) Thanks [@rossiam](https://github.com/rossiam)! - bump core SDK version

- [#377](https://github.com/SmartThingsCommunity/smartthings-cli/pull/377) [`ea04f1e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ea04f1ed890201608f921979c0c3b3a647ce6e59) Thanks [@rossiam](https://github.com/rossiam)! - clean-up refactor of command helper functions (functions we use to do most of the work for most of our commands like `selectFromList` and `formatAndWriteItem`)

  - made the `Sorting` interface generic, dependent on the type of the object being sorted
  - changed type of `primaryKeyName` and `sortingKeyName` for `Sorting` interface to constrain them to string keys from the object being sorted
  - added `extends object` constraint to objects handled by command helper functions
  - rename `outputListing` to `outputItemOrList` and `outputListingGeneric` to `outputItemOrListGeneric`
  - update/add config types for command helper functions with consistent naming (`InputAndOutputItemConfig` for `inputAndOutputItem`, `FormatAndWriteItemConfig` for `formatAndWriteItem`, etc.)

- [`2ed225f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2ed225f6fd4843aad4550634d49facb87ede7c7d) Thanks [@rossiam](https://github.com/rossiam)! - added `configKeyForDefaultValue` option to `selectFromList` function
  refactor selectFromList
  added `stringArrayConfigValue` method to `SmartThingsCommand`

- [#339](https://github.com/SmartThingsCommunity/smartthings-cli/pull/339) [`0849c4e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0849c4e36f81816cce8c6204c339424a8211c556) Thanks [@rossiam](https://github.com/rossiam)! - Update table output: - switch to table package which handles international characters properly - removed compact / expanded command line options - removed compactTableOutput configuration option - added group-rows and no-group-rows command line options - added groupTableOutputRows configuration option - (lib) completely isolated use of dependency to table-generator.ts

- [#327](https://github.com/SmartThingsCommunity/smartthings-cli/pull/327) [`82652c9`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/82652c9a2fc144ee253e256718f034b47aeca7fc) Thanks [@bflorian](https://github.com/bflorian)! - Added commands to create virtual devices and generate events on their behalf

- [#360](https://github.com/SmartThingsCommunity/smartthings-cli/pull/360) [`47b27d2`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/47b27d2e2d74324a199302f6709ef698599a984c) Thanks [@rossiam](https://github.com/rossiam)! - refactor handling of headers on initialization

- [#292](https://github.com/SmartThingsCommunity/smartthings-cli/pull/292) [`d91418c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d91418caa5d54f984728ed02520338ac2410eae6) Thanks [@john-u](https://github.com/john-u)! - Replace LogManager class and associated global in favor of log4js-api.

- [#375](https://github.com/SmartThingsCommunity/smartthings-cli/pull/375) [`3523e38`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3523e38aa4b47f0a411b7969fb1771bbb7c50900) Thanks [@john-u](https://github.com/john-u)! - bump @smartthings/plugin-cli-edge to support newer oclif/core version

- [#367](https://github.com/SmartThingsCommunity/smartthings-cli/pull/367) [`22b9a78`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/22b9a78570d44e4df8adfd265c95148c2e29256b) Thanks [@john-u](https://github.com/john-u)! - pin dependency to resolve timeout error

- [#356](https://github.com/SmartThingsCommunity/smartthings-cli/pull/356) [`97f5c32`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/97f5c32db1be3b96ed7fc637ade3c1e209300ff5) Thanks [@john-u](https://github.com/john-u)! - - use unknown in sse-io interfaces instead of any

  - document sse-io utilities
  - bump deps

- [#278](https://github.com/SmartThingsCommunity/smartthings-cli/pull/278) [`b0cb399`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/b0cb3990dc07b0072d50802de95168acb4e94467) Thanks [@john-u](https://github.com/john-u)! - update oclif packages

- [#395](https://github.com/SmartThingsCommunity/smartthings-cli/pull/395) [`4677218`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/46772188ff8a7d432757a871aa49272c86b28e64) Thanks [@rossiam](https://github.com/rossiam)! - added support for removing managed config values

- [#335](https://github.com/SmartThingsCommunity/smartthings-cli/pull/335) [`975c037`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/975c037c7983a1073eb6bf9f133e0f99599342df) Thanks [@john-u](https://github.com/john-u)! - update @smartthings/core-sdk to 5.0.0

- [#392](https://github.com/SmartThingsCommunity/smartthings-cli/pull/392) [`594b5c7`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/594b5c73b3803e6f7f4e47fa175e5aee5df4f250) Thanks [@rossiam](https://github.com/rossiam)! - added `withLocation` function to add location information to single item (similar to `withLocations` for multiple items)

## 1.0.0-beta.17

### Patch Changes

- [#412](https://github.com/SmartThingsCommunity/smartthings-cli/pull/412) [`e9ff59c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e9ff59ca0f5963d09b7193589762592af61db5e8) Thanks [@rossiam](https://github.com/rossiam)! - refactored `TableGenerator` interface and supporting code

## 1.0.0-beta.16

### Patch Changes

- [#395](https://github.com/SmartThingsCommunity/smartthings-cli/pull/395) [`4677218`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/46772188ff8a7d432757a871aa49272c86b28e64) Thanks [@rossiam](https://github.com/rossiam)! - added support for removing managed config values

## 1.0.0-beta.15

### Patch Changes

- [#398](https://github.com/SmartThingsCommunity/smartthings-cli/pull/398) [`d20ad61`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d20ad6198f663a5ecb04af1d80ccf42d10214fa9) Thanks [@rossiam](https://github.com/rossiam)! - IMPORTANT: removed `-id` suffix from command line flags that had them for consistency

* [#392](https://github.com/SmartThingsCommunity/smartthings-cli/pull/392) [`594b5c7`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/594b5c73b3803e6f7f4e47fa175e5aee5df4f250) Thanks [@rossiam](https://github.com/rossiam)! - added `withLocation` function to add location information to single item (similar to `withLocations` for multiple items)

## 1.0.0-beta.14

### Patch Changes

- [#377](https://github.com/SmartThingsCommunity/smartthings-cli/pull/377) [`ea04f1e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ea04f1ed890201608f921979c0c3b3a647ce6e59) Thanks [@rossiam](https://github.com/rossiam)! - clean-up refactor of command helper functions (functions we use to do most of the work for most of our commands like `selectFromList` and `formatAndWriteItem`)

  - made the `Sorting` interface generic, dependent on the type of the object being sorted
  - changed type of `primaryKeyName` and `sortingKeyName` for `Sorting` interface to constrain them to string keys from the object being sorted
  - added `extends object` constraint to objects handled by command helper functions
  - rename `outputListing` to `outputItemOrList` and `outputListingGeneric` to `outputItemOrListGeneric`
  - update/add config types for command helper functions with consistent naming (`InputAndOutputItemConfig` for `inputAndOutputItem`, `FormatAndWriteItemConfig` for `formatAndWriteItem`, etc.)

## 1.0.0-beta.13

### Patch Changes

- [#375](https://github.com/SmartThingsCommunity/smartthings-cli/pull/375) [`3523e38`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3523e38aa4b47f0a411b7969fb1771bbb7c50900) Thanks [@john-u](https://github.com/john-u)! - bump @smartthings/plugin-cli-edge to support newer oclif/core version

## 1.0.0-beta.12

### Patch Changes

- [#361](https://github.com/SmartThingsCommunity/smartthings-cli/pull/361) [`688082f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/688082fe6d0e12e0e510b5c238de61b46bfddc08) Thanks [@bflorian](https://github.com/bflorian)! - Add userEmail field to ST Schema apps

* [#360](https://github.com/SmartThingsCommunity/smartthings-cli/pull/360) [`47b27d2`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/47b27d2e2d74324a199302f6709ef698599a984c) Thanks [@rossiam](https://github.com/rossiam)! - refactor handling of headers on initialization

- [#367](https://github.com/SmartThingsCommunity/smartthings-cli/pull/367) [`22b9a78`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/22b9a78570d44e4df8adfd265c95148c2e29256b) Thanks [@john-u](https://github.com/john-u)! - pin dependency to resolve timeout error

## 1.0.0-beta.11

### Patch Changes

- [#356](https://github.com/SmartThingsCommunity/smartthings-cli/pull/356) [`97f5c32`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/97f5c32db1be3b96ed7fc637ade3c1e209300ff5) Thanks [@john-u](https://github.com/john-u)! - - use unknown in sse-io interfaces instead of any
  - document sse-io utilities
  - bump deps

## 1.0.0-beta.10

### Patch Changes

- [#339](https://github.com/SmartThingsCommunity/smartthings-cli/pull/339) [`0849c4e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0849c4e36f81816cce8c6204c339424a8211c556) Thanks [@rossiam](https://github.com/rossiam)! - Update table output: - switch to table package which handles international characters properly - removed compact / expanded command line options - removed compactTableOutput configuration option - added group-rows and no-group-rows command line options - added groupTableOutputRows configuration option - (lib) completely isolated use of dependency to table-generator.ts

* [#327](https://github.com/SmartThingsCommunity/smartthings-cli/pull/327) [`82652c9`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/82652c9a2fc144ee253e256718f034b47aeca7fc) Thanks [@bflorian](https://github.com/bflorian)! - Added commands to create virtual devices and generate events on their behalf

- [#335](https://github.com/SmartThingsCommunity/smartthings-cli/pull/335) [`975c037`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/975c037c7983a1073eb6bf9f133e0f99599342df) Thanks [@john-u](https://github.com/john-u)! - update @smartthings/core-sdk to 5.0.0

## 1.0.0-beta.9

### Patch Changes

- [#317](https://github.com/SmartThingsCommunity/smartthings-cli/pull/317) [`1e0bae5`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/1e0bae5d33dbb2ca967ab18677616b407baf86fe) Thanks [@rossiam](https://github.com/rossiam)! - bump core SDK version

## 1.0.0-beta.8

### Patch Changes

- [#309](https://github.com/SmartThingsCommunity/smartthings-cli/pull/309) [`7e3a1b8`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/7e3a1b83d6c301aa86fe35d5660cfadde2bcfaf1) Thanks [@john-u](https://github.com/john-u)! - - shutdown logger before Node exits
  - update @oclif deps to latest
  - replace process exits with command errors

## 1.0.0-beta.7

### Patch Changes

- [#306](https://github.com/SmartThingsCommunity/smartthings-cli/pull/306) [`d4730e0`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d4730e00712ddb18b916295b138301afaa8c23eb) Thanks [@john-u](https://github.com/john-u)! - add debug logging to defualt login authenticator

## 1.0.0-beta.6

### Patch Changes

- [#297](https://github.com/SmartThingsCommunity/smartthings-cli/pull/297) [`d0fd25d`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d0fd25d12158214c051584a19efb260f938204ce) Thanks [@john-u](https://github.com/john-u)! - parse once from base command

## 1.0.0-beta.5

### Patch Changes

- [#293](https://github.com/SmartThingsCommunity/smartthings-cli/pull/293) [`4464873`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/44648732d54093a1e9f842dfb99dfe8bc81ea131) Thanks [@rossiam](https://github.com/rossiam)! - move chooseDevice into lib for use in plugins

* [#294](https://github.com/SmartThingsCommunity/smartthings-cli/pull/294) [`356a24b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/356a24be75a467f82f627a654dd6a1c8b83c56f8) Thanks [@john-u](https://github.com/john-u)! - Add ability to enable debug logging (to console) via env variable.

## 1.0.0-beta.4

### Patch Changes

- [#292](https://github.com/SmartThingsCommunity/smartthings-cli/pull/292) [`d91418c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d91418caa5d54f984728ed02520338ac2410eae6) Thanks [@john-u](https://github.com/john-u)! - Replace LogManager class and associated global in favor of log4js-api.

## 1.0.0-beta.3

### Patch Changes

- [#274](https://github.com/SmartThingsCommunity/smartthings-cli/pull/274) [`efc1eed`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/efc1eed852a61399342b5040c2d60561bbfb17af) Thanks [@john-u](https://github.com/john-u)! - replace usage of lodash with native ES or separate lodash modules

* [#278](https://github.com/SmartThingsCommunity/smartthings-cli/pull/278) [`b0cb399`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/b0cb3990dc07b0072d50802de95168acb4e94467) Thanks [@john-u](https://github.com/john-u)! - update oclif packages

## 1.0.0-beta.2

### Patch Changes

- [#271](https://github.com/SmartThingsCommunity/smartthings-cli/pull/271) [`2ed225f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2ed225f6fd4843aad4550634d49facb87ede7c7d) Thanks [@rossiam](https://github.com/rossiam)! - add config:reset command

* [#271](https://github.com/SmartThingsCommunity/smartthings-cli/pull/271) [`2ed225f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2ed225f6fd4843aad4550634d49facb87ede7c7d) Thanks [@rossiam](https://github.com/rossiam)! - added `configKeyForDefaultValue` option to `selectFromList` function
  refactor selectFromList
  added `stringArrayConfigValue` method to `SmartThingsCommand`

## 1.0.0-beta.1

### Patch Changes

- [#268](https://github.com/SmartThingsCommunity/smartthings-cli/pull/268) [`a77e73b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a77e73b4348e4a3d65798e2711fbb40ecf0a139d) Thanks [@rossiam](https://github.com/rossiam)! - refactor CLIConfig class into methods and interfaces

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-beta.0](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.41...v1.0.0-beta.0) (2022-03-10)

**Note:** Version bump only for package @smartthings/cli-lib

# [1.0.0-beta.0](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.41...v1.0.0-beta.0) (2022-03-10)

**Note:** Version bump only for package @smartthings/cli-lib

# [0.0.0-pre.41](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.40...v0.0.0-pre.41) (2022-03-07)

### Bug Fixes

- **deps:** bump plugin-cli-edge to 1.10.1 ([14d7ad3](https://github.com/SmartThingsCommunity/smartthings-cli/commit/14d7ad324216105dac2b3ad7b15e673207a63d3d))

# [0.0.0-pre.40](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.39...v0.0.0-pre.40) (2022-03-03)

### Features

- include unique User-Agent in client requests ([4886cc2](https://github.com/SmartThingsCommunity/smartthings-cli/commit/4886cc28f7925972aeacabc84b306f60c3fad7c1))

# [0.0.0-pre.39](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.38...v0.0.0-pre.39) (2022-02-18)

### Features

- add type filter to devices command; minor refactoring ([5ea91d7](https://github.com/SmartThingsCommunity/smartthings-cli/commit/5ea91d7825aa87383d0c2a832c4aee4f5e3a0f55))

# [0.0.0-pre.37](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.36...v0.0.0-pre.37) (2022-02-11)

### Bug Fixes

- **deps:** update dependencies ([24d0c23](https://github.com/SmartThingsCommunity/smartthings-cli/commit/24d0c23462ec3bb6c4b8fd1e57fd5d27072efe94))

### Features

- hide uncommon flags from help to reduce clutter ([deaebb4](https://github.com/SmartThingsCommunity/smartthings-cli/commit/deaebb4074ac3b90e1d7d8362c538a0b1be27011))
- log warning headers when present ([5583bde](https://github.com/SmartThingsCommunity/smartthings-cli/commit/5583bdee31744adf187dee541966bbbd89e5e7bb))

### Performance Improvements

- migrate to @oclif/core ([7354083](https://github.com/SmartThingsCommunity/smartthings-cli/commit/7354083c18b52ec04836455a6107d98e8cc741ba))

# [0.0.0-pre.36](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.35...v0.0.0-pre.36) (2022-01-27)

### Features

- add rules:execute command ([e84b27f](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e84b27f113d52df5da59f803938637600345291b))
- warn when config extensions are .yml ([e21b4c9](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e21b4c9c2accb6b08d9b58e346f18922e7ddab83))

# [0.0.0-pre.35](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.34...v0.0.0-pre.35) (2022-01-19)

### Bug Fixes

- update versions for oclif dependencies ([e943245](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e94324526e45bba40706d0b77767f17781a42dec))

### Features

- **devicepreferences:** expanded i18n support ([109bd38](https://github.com/SmartThingsCommunity/smartthings-cli/commit/109bd384ccfe806e159cf8d474188075ede1b0e7))
- update standard device details output ([0867f77](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0867f775ab58fe5cbd1979bb1365e4004ff9f4b7))

# [0.0.0-pre.34](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.33...v0.0.0-pre.34) (2021-12-23)

### Features

- **edge:** debug logging in logcat ([dd8df46](https://github.com/SmartThingsCommunity/smartthings-cli/commit/dd8df46f396f96944852c3b5480422d828a1545c))

# [0.0.0-pre.33](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.32...v0.0.0-pre.33) (2021-12-15)

### Features

- Added support for Organizations ([5513e21](https://github.com/SmartThingsCommunity/smartthings-cli/commit/5513e21fabf1af6a0dc72ce4d7e24896af78d4ee))
- **devicepreferences:** initial suppport for i18n ([3319994](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3319994ff3e8d4974d568327950ebfe69e61b453))

# [0.0.0-pre.32](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.31...v0.0.0-pre.32) (2021-10-25)

### Bug Fixes

- scrub sensitive info from logging ([6b374f8](https://github.com/SmartThingsCommunity/smartthings-cli/commit/6b374f880f78f724f2dfb139f89c39c9188de7cf))

### Features

- **lib:** add easy access to string config values ([17c013d](https://github.com/SmartThingsCommunity/smartthings-cli/commit/17c013d190a5f6923072f0a992cdef77bbeae9e9))

# [0.0.0-pre.29](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.28...v0.0.0-pre.29) (2021-09-10)

### Bug Fixes

- **SseCommand:** call base Command init ([91d6a99](https://github.com/SmartThingsCommunity/smartthings-cli/commit/91d6a9916680564f52fe301f7b14c82d706ce420))

### Features

- Added schema:regenerate to create new client IDs and secrets ([8cc9d9a](https://github.com/SmartThingsCommunity/smartthings-cli/commit/8cc9d9a3a8e6f7e7fae61985685e635a9dd8bdef))

# [0.0.0-pre.27](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.26...v0.0.0-pre.27) (2021-08-16)

### Bug Fixes

- narrow type accepted by event logger ([f0882eb](https://github.com/SmartThingsCommunity/smartthings-cli/commit/f0882eb56909d81c2a6558171b1b75bd9ace8c57))

# [0.0.0-pre.26](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.25...v0.0.0-pre.26) (2021-07-22)

### Bug Fixes

- reset authenticationInfo before login, handle error cases better ([ed6ab48](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ed6ab4866fc4453215daa723f23069d296a97b18))

### Features

- add support for device preferences commands ([d4ad86d](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d4ad86d92a1d7b29f7641bc3b1ab3961a510edc8))
- Added device preferences and capability units ([1d9b1c1](https://github.com/SmartThingsCommunity/smartthings-cli/commit/1d9b1c11054243c8e69c8a6dc4d4b817631f0b1b))

# [0.0.0-pre.25](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.24...v0.0.0-pre.25) (2021-05-24)

### Bug Fixes

- fixes to capability translations ([f8b7471](https://github.com/SmartThingsCommunity/smartthings-cli/commit/f8b7471127445ca6c68eaf629449c522080cd423))

### Features

- **LoginAuthenticator:** provide generic auth method ([ae82b6a](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ae82b6a7dc71e10377a20d03ec915a8fe81cdb9c))
- add device preferences output to device profiles ([fa53f10](https://github.com/SmartThingsCommunity/smartthings-cli/commit/fa53f10eec476fc7a07f832e5e95c2f081081d80))
- log errors from source handler ([dc3523b](https://github.com/SmartThingsCommunity/smartthings-cli/commit/dc3523bd8f10181d2f06f456c68797239af94257))

# [0.0.0-pre.24](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.23...v0.0.0-pre.24) (2021-04-29)

### Features

- add logout command which just removes credential for now ([942d886](https://github.com/SmartThingsCommunity/smartthings-cli/commit/942d8863fee0ad5a5f2056f98468788ba5c937c4))

# [0.0.0-pre.22](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.21...v0.0.0-pre.22) (2021-04-21)

### Bug Fixes

- **deps:** include cli-ux as dependency ([c4348be](https://github.com/SmartThingsCommunity/smartthings-cli/commit/c4348be9b99fbc6ec0819d58a0ae4b9c4bd65521))

# [0.0.0-pre.21](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.20...v0.0.0-pre.21) (2021-04-20)

### Features

- accept eventsource init dict ([45eb35f](https://github.com/SmartThingsCommunity/smartthings-cli/commit/45eb35f34a29c0763eebd286d9bde4e43b539ff2))

# [0.0.0-pre.20](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.19...v0.0.0-pre.20) (2021-04-12)

### Features

- **lib:** stream SSE with custom output format ([7f0444d](https://github.com/SmartThingsCommunity/smartthings-cli/commit/7f0444df6abb1dcddb40330a8311f5d5096b99ac))

# [0.0.0-pre.19](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.18...v0.0.0-pre.19) (2021-04-06)

### Features

- output JSON by default when not outputting to the console ([a0d91ff](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a0d91ff73d40131392fb57407c90ce01806b0424))

# [0.0.0-pre.18](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.17...v0.0.0-pre.18) (2021-02-01)

**Note:** Version bump only for package @smartthings/cli-lib

# [0.0.0-pre.17](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.16...v0.0.0-pre.17) (2021-01-25)

**Note:** Version bump only for package @smartthings/cli-lib

# [0.0.0-pre.16](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.15...v0.0.0-pre.16) (2021-01-22)

### Bug Fixes

- correct ordering of InputProcessor calls ([dd4dfd0](https://github.com/SmartThingsCommunity/smartthings-cli/commit/dd4dfd0938f6b6888ce1f0a48840d4b8b0ccdddf))
- fix rules lookup without location id and functional refactor ([bfa67b6](https://github.com/SmartThingsCommunity/smartthings-cli/commit/bfa67b6167c32281825559c65e4f38e38ab1d863))

### Features

- Added support for specifying a language header ([00f50b9](https://github.com/SmartThingsCommunity/smartthings-cli/commit/00f50b9d8aadf0275f4e6426d68207903e639829))

# [0.0.0-pre.15](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.14...v0.0.0-pre.15) (2020-12-21)

### Bug Fixes

- Added support for device presentation manufacturer name ([804eaaa](https://github.com/SmartThingsCommunity/smartthings-cli/commit/804eaaa906d965dd7e66aa98d3e66b166f90fe68))
- remove unnecessary node dependency in lib ([27c38e3](https://github.com/SmartThingsCommunity/smartthings-cli/commit/27c38e3fddb692b7985e77a0d5147f17f929558a))
- use InstalledApp fields in installedapps:rename and refactor to use new functional paradigm ([8170818](https://github.com/SmartThingsCommunity/smartthings-cli/commit/817081833d5d260f48a5fda1255b12ff631ca0da))

# [0.0.0-pre.14](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.13...v0.0.0-pre.14) (2020-12-07)

### Features

- **logger:** default log file path to oclif cacheDir ([a1ce523](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a1ce523eac18c0ddda4c92bc627658bd394a0862))

# [0.0.0-pre.13](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.12...v0.0.0-pre.13) (2020-10-22)

**Note:** Version bump only for package @smartthings/cli-lib

# [0.0.0-pre.11](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.10...v0.0.0-pre.11) (2020-09-28)

### Bug Fixes

- remove ambiguous log method ([5466cd6](https://github.com/SmartThingsCommunity/smartthings-cli/commit/5466cd6ad3ed8bf35ab79d40f7ec2023cbd81f62))
- Update to accommodate switch from vid to presentationId ([3756ed7](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3756ed74abf6feca1d0ba44518ebb85de3930904))

### Features

- add support for access to parsed argv property ([48d1264](https://github.com/SmartThingsCommunity/smartthings-cli/commit/48d12644baaf417e26285a97e4c3ef17562f6c52))
- added device profile and capability localizations ([6a48783](https://github.com/SmartThingsCommunity/smartthings-cli/commit/6a487830539eb3660358c8c448ce1de2e3465f8e))
- use separate file for logging config ([80b3005](https://github.com/SmartThingsCommunity/smartthings-cli/commit/80b30051abb6670ea36f479e18c202fb3bf7b289))

# [0.0.0-pre.10](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.9...v0.0.0-pre.10) (2020-09-02)

### Bug Fixes

- bump core-sdk and log4js versions ([2a3f9ff](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2a3f9fffdabbf5f5babb0cc4aaffe648ddd7ebd8))

# [0.0.0-pre.9](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.8...v0.0.0-pre.9) (2020-09-02)

### Features

- export api-helpers functions ([d723b85](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d723b85cd8745ee3631ad5976eecd0ae66e50e0a))

# [0.0.0-pre.8](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.7...v0.0.0-pre.8) (2020-08-17)

### Bug Fixes

- **LoginAuthenticator:** create cli dir on init ([27d7bee](https://github.com/SmartThingsCommunity/smartthings-cli/commit/27d7bee76a0e8b8043686dd6b066f8fb8bd0d2b9))

### Features

- add support for building input form command line options ([599c3c2](https://github.com/SmartThingsCommunity/smartthings-cli/commit/599c3c261fd8d84218f477d0118b1a5e2de4a90a))

# [0.0.0-pre.7](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.6...v0.0.0-pre.7) (2020-07-31)

**Note:** Version bump only for package @smartthings/cli-lib

# [0.0.0-pre.6](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.5...v0.0.0-pre.6) (2020-07-28)

### Bug Fixes

- make logManager and credentials work across with plugins ([e267b53](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e267b53d3cef7959dd60fb48efd6d25e953beafb))

# [0.0.0-pre.5](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.4...v0.0.0-pre.5) (2020-07-28)

### Bug Fixes

- make cliConfig truly global ([6e2d45f](https://github.com/SmartThingsCommunity/smartthings-cli/commit/6e2d45f5960f8c3340b5e420139bb73674c1dde5))

# [0.0.0-pre.4](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.3...v0.0.0-pre.4) (2020-07-27)

**Note:** Version bump only for package @smartthings/cli-lib

# [0.0.0-pre.3](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.1-pre2...v0.0.0-pre.3) (2020-07-22)

**Note:** Version bump only for package @smartthings/cli-lib
