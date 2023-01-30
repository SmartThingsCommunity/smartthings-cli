# Change Log

## 1.1.0

### Minor Changes

- [#462](https://github.com/SmartThingsCommunity/smartthings-cli/pull/462) [`b03292d`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/b03292dffcab45dfc8b8fdb915ce5b198824e491) Thanks [@Sitlintac](https://github.com/Sitlintac)! - enable verbose flag when getting a single device

  add helper method to get location and room names for a single item

### Patch Changes

- Updated dependencies [[`b03292d`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/b03292dffcab45dfc8b8fdb915ce5b198824e491)]:
  - @smartthings/cli-lib@1.1.0

## 1.0.0

### Patch Changes

- [#294](https://github.com/SmartThingsCommunity/smartthings-cli/pull/294) [`356a24b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/356a24be75a467f82f627a654dd6a1c8b83c56f8) Thanks [@john-u](https://github.com/john-u)! - Add ability to enable debug logging (to console) via env variable.

- [#374](https://github.com/SmartThingsCommunity/smartthings-cli/pull/374) [`aeb8b28`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/aeb8b2892ca4de80fd4335a7ed1e8af2ed5153c4) Thanks [@bflorian](https://github.com/bflorian)! - feat: added device and location history commands

- [#404](https://github.com/SmartThingsCommunity/smartthings-cli/pull/404) [`86ad2ec`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/86ad2ec1f2a2dd7cf53827ac357f9f42bf4395e5) Thanks [@rossiam](https://github.com/rossiam)! - include resetManagedConfigKey in mocked functions

- [#268](https://github.com/SmartThingsCommunity/smartthings-cli/pull/268) [`a77e73b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a77e73b4348e4a3d65798e2711fbb40ecf0a139d) Thanks [@rossiam](https://github.com/rossiam)! - refactor CLIConfig class into methods and interfaces

- [#286](https://github.com/SmartThingsCommunity/smartthings-cli/pull/286) [`c316148`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/c316148ed51a154743ffc34f033efb97da9ebe48) Thanks [@john-u](https://github.com/john-u)! - refactor setupFiles to avoid duplication and remove setup function in favor of self executing module

- [#412](https://github.com/SmartThingsCommunity/smartthings-cli/pull/412) [`e9ff59c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e9ff59ca0f5963d09b7193589762592af61db5e8) Thanks [@rossiam](https://github.com/rossiam)! - refactored `TableGenerator` interface and supporting code

- [#317](https://github.com/SmartThingsCommunity/smartthings-cli/pull/317) [`1e0bae5`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/1e0bae5d33dbb2ca967ab18677616b407baf86fe) Thanks [@rossiam](https://github.com/rossiam)! - bump core SDK version

- [#301](https://github.com/SmartThingsCommunity/smartthings-cli/pull/301) [`6ad407a`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/6ad407a0e98b4125ff8bbdd1ed237b8e9f81e8ca) Thanks [@john-u](https://github.com/john-u)! - bump @smartthings/plugin-cli-edge

- [#377](https://github.com/SmartThingsCommunity/smartthings-cli/pull/377) [`ea04f1e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ea04f1ed890201608f921979c0c3b3a647ce6e59) Thanks [@rossiam](https://github.com/rossiam)! - clean-up refactor of command helper functions (functions we use to do most of the work for most of our commands like `selectFromList` and `formatAndWriteItem`)

  - made the `Sorting` interface generic, dependent on the type of the object being sorted
  - changed type of `primaryKeyName` and `sortingKeyName` for `Sorting` interface to constrain them to string keys from the object being sorted
  - added `extends object` constraint to objects handled by command helper functions
  - rename `outputListing` to `outputItemOrList` and `outputListingGeneric` to `outputItemOrListGeneric`
  - update/add config types for command helper functions with consistent naming (`InputAndOutputItemConfig` for `inputAndOutputItem`, `FormatAndWriteItemConfig` for `formatAndWriteItem`, etc.)

- [#360](https://github.com/SmartThingsCommunity/smartthings-cli/pull/360) [`47b27d2`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/47b27d2e2d74324a199302f6709ef698599a984c) Thanks [@rossiam](https://github.com/rossiam)! - refactor handling of headers on initialization

- [#292](https://github.com/SmartThingsCommunity/smartthings-cli/pull/292) [`d91418c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d91418caa5d54f984728ed02520338ac2410eae6) Thanks [@john-u](https://github.com/john-u)! - Replace LogManager class and associated global in favor of log4js-api.

- [#331](https://github.com/SmartThingsCommunity/smartthings-cli/pull/331) [`8b0a5b8`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/8b0a5b8523c8bcc8a622359a501b064b813dca4c) Thanks [@john-u](https://github.com/john-u)! - mock withLocations by default

- [#325](https://github.com/SmartThingsCommunity/smartthings-cli/pull/325) [`0681344`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/068134443d8a960b6565b2111b2a81b076b33bd7) Thanks [@john-u](https://github.com/john-u)! - mock inputItem by default

- [#335](https://github.com/SmartThingsCommunity/smartthings-cli/pull/335) [`975c037`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/975c037c7983a1073eb6bf9f133e0f99599342df) Thanks [@john-u](https://github.com/john-u)! - update @smartthings/core-sdk to 5.0.0

- Updated dependencies [[`4464873`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/44648732d54093a1e9f842dfb99dfe8bc81ea131), [`7e3a1b8`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/7e3a1b83d6c301aa86fe35d5660cfadde2bcfaf1), [`356a24b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/356a24be75a467f82f627a654dd6a1c8b83c56f8), [`d20ad61`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d20ad6198f663a5ecb04af1d80ccf42d10214fa9), [`d4730e0`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d4730e00712ddb18b916295b138301afaa8c23eb), [`2ed225f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2ed225f6fd4843aad4550634d49facb87ede7c7d), [`efc1eed`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/efc1eed852a61399342b5040c2d60561bbfb17af), [`a77e73b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a77e73b4348e4a3d65798e2711fbb40ecf0a139d), [`d0fd25d`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d0fd25d12158214c051584a19efb260f938204ce), [`688082f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/688082fe6d0e12e0e510b5c238de61b46bfddc08), [`e9ff59c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e9ff59ca0f5963d09b7193589762592af61db5e8), [`1e0bae5`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/1e0bae5d33dbb2ca967ab18677616b407baf86fe), [`ea04f1e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ea04f1ed890201608f921979c0c3b3a647ce6e59), [`2ed225f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2ed225f6fd4843aad4550634d49facb87ede7c7d), [`0849c4e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0849c4e36f81816cce8c6204c339424a8211c556), [`82652c9`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/82652c9a2fc144ee253e256718f034b47aeca7fc), [`47b27d2`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/47b27d2e2d74324a199302f6709ef698599a984c), [`d91418c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d91418caa5d54f984728ed02520338ac2410eae6), [`3523e38`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3523e38aa4b47f0a411b7969fb1771bbb7c50900), [`22b9a78`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/22b9a78570d44e4df8adfd265c95148c2e29256b), [`97f5c32`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/97f5c32db1be3b96ed7fc637ade3c1e209300ff5), [`b0cb399`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/b0cb3990dc07b0072d50802de95168acb4e94467), [`4677218`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/46772188ff8a7d432757a871aa49272c86b28e64), [`975c037`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/975c037c7983a1073eb6bf9f133e0f99599342df), [`594b5c7`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/594b5c73b3803e6f7f4e47fa175e5aee5df4f250)]:
  - @smartthings/cli-lib@1.0.0

## 1.0.0-beta.11

### Patch Changes

- [#412](https://github.com/SmartThingsCommunity/smartthings-cli/pull/412) [`e9ff59c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e9ff59ca0f5963d09b7193589762592af61db5e8) Thanks [@rossiam](https://github.com/rossiam)! - refactored `TableGenerator` interface and supporting code

- Updated dependencies [[`e9ff59c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e9ff59ca0f5963d09b7193589762592af61db5e8)]:
  - @smartthings/cli-lib@1.0.0-beta.17

## 1.0.0-beta.10

### Patch Changes

- [#404](https://github.com/SmartThingsCommunity/smartthings-cli/pull/404) [`86ad2ec`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/86ad2ec1f2a2dd7cf53827ac357f9f42bf4395e5) Thanks [@rossiam](https://github.com/rossiam)! - include resetManagedConfigKey in mocked functions

## 1.0.0-beta.9

### Patch Changes

- [#377](https://github.com/SmartThingsCommunity/smartthings-cli/pull/377) [`ea04f1e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ea04f1ed890201608f921979c0c3b3a647ce6e59) Thanks [@rossiam](https://github.com/rossiam)! - clean-up refactor of command helper functions (functions we use to do most of the work for most of our commands like `selectFromList` and `formatAndWriteItem`)

  - made the `Sorting` interface generic, dependent on the type of the object being sorted
  - changed type of `primaryKeyName` and `sortingKeyName` for `Sorting` interface to constrain them to string keys from the object being sorted
  - added `extends object` constraint to objects handled by command helper functions
  - rename `outputListing` to `outputItemOrList` and `outputListingGeneric` to `outputItemOrListGeneric`
  - update/add config types for command helper functions with consistent naming (`InputAndOutputItemConfig` for `inputAndOutputItem`, `FormatAndWriteItemConfig` for `formatAndWriteItem`, etc.)

- Updated dependencies [[`ea04f1e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ea04f1ed890201608f921979c0c3b3a647ce6e59)]:
  - @smartthings/cli-lib@1.0.0-beta.14

## 1.0.0-beta.8

### Patch Changes

- [#374](https://github.com/SmartThingsCommunity/smartthings-cli/pull/374) [`aeb8b28`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/aeb8b2892ca4de80fd4335a7ed1e8af2ed5153c4) Thanks [@bflorian](https://github.com/bflorian)! - feat: added device and location history commands

- Updated dependencies [[`3523e38`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3523e38aa4b47f0a411b7969fb1771bbb7c50900)]:
  - @smartthings/cli-lib@1.0.0-beta.13

## 1.0.0-beta.7

### Patch Changes

- [#360](https://github.com/SmartThingsCommunity/smartthings-cli/pull/360) [`47b27d2`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/47b27d2e2d74324a199302f6709ef698599a984c) Thanks [@rossiam](https://github.com/rossiam)! - refactor handling of headers on initialization

- Updated dependencies [[`688082f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/688082fe6d0e12e0e510b5c238de61b46bfddc08), [`47b27d2`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/47b27d2e2d74324a199302f6709ef698599a984c), [`22b9a78`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/22b9a78570d44e4df8adfd265c95148c2e29256b)]:
  - @smartthings/cli-lib@1.0.0-beta.12

## 1.0.0-beta.6

### Patch Changes

- [#331](https://github.com/SmartThingsCommunity/smartthings-cli/pull/331) [`8b0a5b8`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/8b0a5b8523c8bcc8a622359a501b064b813dca4c) Thanks [@john-u](https://github.com/john-u)! - mock withLocations by default

* [#325](https://github.com/SmartThingsCommunity/smartthings-cli/pull/325) [`0681344`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/068134443d8a960b6565b2111b2a81b076b33bd7) Thanks [@john-u](https://github.com/john-u)! - mock inputItem by default

- [#335](https://github.com/SmartThingsCommunity/smartthings-cli/pull/335) [`975c037`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/975c037c7983a1073eb6bf9f133e0f99599342df) Thanks [@john-u](https://github.com/john-u)! - update @smartthings/core-sdk to 5.0.0

- Updated dependencies [[`0849c4e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0849c4e36f81816cce8c6204c339424a8211c556), [`82652c9`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/82652c9a2fc144ee253e256718f034b47aeca7fc), [`975c037`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/975c037c7983a1073eb6bf9f133e0f99599342df)]:
  - @smartthings/cli-lib@1.0.0-beta.10

## 1.0.0-beta.5

### Patch Changes

- [#317](https://github.com/SmartThingsCommunity/smartthings-cli/pull/317) [`1e0bae5`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/1e0bae5d33dbb2ca967ab18677616b407baf86fe) Thanks [@rossiam](https://github.com/rossiam)! - bump core SDK version

- Updated dependencies [[`1e0bae5`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/1e0bae5d33dbb2ca967ab18677616b407baf86fe)]:
  - @smartthings/cli-lib@1.0.0-beta.9

## 1.0.0-beta.4

### Patch Changes

- [#301](https://github.com/SmartThingsCommunity/smartthings-cli/pull/301) [`6ad407a`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/6ad407a0e98b4125ff8bbdd1ed237b8e9f81e8ca) Thanks [@john-u](https://github.com/john-u)! - bump @smartthings/plugin-cli-edge

## 1.0.0-beta.3

### Patch Changes

- [#294](https://github.com/SmartThingsCommunity/smartthings-cli/pull/294) [`356a24b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/356a24be75a467f82f627a654dd6a1c8b83c56f8) Thanks [@john-u](https://github.com/john-u)! - Add ability to enable debug logging (to console) via env variable.

- Updated dependencies [[`4464873`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/44648732d54093a1e9f842dfb99dfe8bc81ea131), [`356a24b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/356a24be75a467f82f627a654dd6a1c8b83c56f8)]:
  - @smartthings/cli-lib@1.0.0-beta.5

## 1.0.0-beta.2

### Patch Changes

- [#286](https://github.com/SmartThingsCommunity/smartthings-cli/pull/286) [`c316148`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/c316148ed51a154743ffc34f033efb97da9ebe48) Thanks [@john-u](https://github.com/john-u)! - refactor setupFiles to avoid duplication and remove setup function in favor of self executing module

* [#292](https://github.com/SmartThingsCommunity/smartthings-cli/pull/292) [`d91418c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d91418caa5d54f984728ed02520338ac2410eae6) Thanks [@john-u](https://github.com/john-u)! - Replace LogManager class and associated global in favor of log4js-api.

* Updated dependencies [[`d91418c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d91418caa5d54f984728ed02520338ac2410eae6)]:
  - @smartthings/cli-lib@1.0.0-beta.4

## 1.0.0-beta.1

### Patch Changes

- [#268](https://github.com/SmartThingsCommunity/smartthings-cli/pull/268) [`a77e73b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a77e73b4348e4a3d65798e2711fbb40ecf0a139d) Thanks [@rossiam](https://github.com/rossiam)! - refactor CLIConfig class into methods and interfaces

- Updated dependencies [[`a77e73b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a77e73b4348e4a3d65798e2711fbb40ecf0a139d)]:
  - @smartthings/cli-lib@1.0.0-beta.1

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-beta.0](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.41...v1.0.0-beta.0) (2022-03-10)

**Note:** Version bump only for package @smartthings/cli-testlib

# [1.0.0-beta.0](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.41...v1.0.0-beta.0) (2022-03-10)

**Note:** Version bump only for package @smartthings/cli-testlib

# [0.0.0-pre.41](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.40...v0.0.0-pre.41) (2022-03-07)

### Bug Fixes

- **deps:** bump plugin-cli-edge to 1.10.1 ([14d7ad3](https://github.com/SmartThingsCommunity/smartthings-cli/commit/14d7ad324216105dac2b3ad7b15e673207a63d3d))

# [0.0.0-pre.40](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.39...v0.0.0-pre.40) (2022-03-03)

**Note:** Version bump only for package @smartthings/cli-testlib

# [0.0.0-pre.39](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.38...v0.0.0-pre.39) (2022-02-18)

**Note:** Version bump only for package @smartthings/cli-testlib

# [0.0.0-pre.37](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.36...v0.0.0-pre.37) (2022-02-11)

### Bug Fixes

- **deps:** update dependencies ([24d0c23](https://github.com/SmartThingsCommunity/smartthings-cli/commit/24d0c23462ec3bb6c4b8fd1e57fd5d27072efe94))

### Performance Improvements

- migrate to @oclif/core ([7354083](https://github.com/SmartThingsCommunity/smartthings-cli/commit/7354083c18b52ec04836455a6107d98e8cc741ba))

# [0.0.0-pre.36](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.35...v0.0.0-pre.36) (2022-01-27)

### Features

- add rules:execute command ([e84b27f](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e84b27f113d52df5da59f803938637600345291b))

# [0.0.0-pre.35](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.34...v0.0.0-pre.35) (2022-01-19)

### Bug Fixes

- update versions for oclif dependencies ([e943245](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e94324526e45bba40706d0b77767f17781a42dec))

### Features

- update standard device details output ([0867f77](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0867f775ab58fe5cbd1979bb1365e4004ff9f4b7))

# [0.0.0-pre.34](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.33...v0.0.0-pre.34) (2021-12-23)

**Note:** Version bump only for package @smartthings/cli-testlib

# [0.0.0-pre.33](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.32...v0.0.0-pre.33) (2021-12-15)

### Features

- **devicepreferences:** initial suppport for i18n ([3319994](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3319994ff3e8d4974d568327950ebfe69e61b453))

# [0.0.0-pre.32](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.31...v0.0.0-pre.32) (2021-10-25)

**Note:** Version bump only for package @smartthings/cli-testlib

# [0.0.0-pre.29](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.28...v0.0.0-pre.29) (2021-09-10)

**Note:** Version bump only for package @smartthings/cli-testlib

# [0.0.0-pre.27](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.26...v0.0.0-pre.27) (2021-08-16)

**Note:** Version bump only for package @smartthings/cli-testlib

# [0.0.0-pre.26](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.25...v0.0.0-pre.26) (2021-07-22)

**Note:** Version bump only for package @smartthings/cli-testlib

# [0.0.0-pre.25](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.24...v0.0.0-pre.25) (2021-05-24)

**Note:** Version bump only for package @smartthings/cli-testlib

# [0.0.0-pre.24](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.23...v0.0.0-pre.24) (2021-04-29)

**Note:** Version bump only for package @smartthings/cli-testlib

# [0.0.0-pre.22](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.21...v0.0.0-pre.22) (2021-04-21)

**Note:** Version bump only for package @smartthings/cli-testlib

# [0.0.0-pre.21](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.20...v0.0.0-pre.21) (2021-04-20)

**Note:** Version bump only for package @smartthings/cli-testlib

# [0.0.0-pre.20](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.19...v0.0.0-pre.20) (2021-04-12)

**Note:** Version bump only for package @smartthings/cli-testlib

# [0.0.0-pre.19](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.18...v0.0.0-pre.19) (2021-04-06)

**Note:** Version bump only for package @smartthings/cli-testlib

# [0.0.0-pre.16](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.15...v0.0.0-pre.16) (2021-01-22)

### Bug Fixes

- correct ordering of InputProcessor calls ([dd4dfd0](https://github.com/SmartThingsCommunity/smartthings-cli/commit/dd4dfd0938f6b6888ce1f0a48840d4b8b0ccdddf))

# [0.0.0-pre.14](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.13...v0.0.0-pre.14) (2020-12-07)

**Note:** Version bump only for package @smartthings/cli-testlib

# [0.0.0-pre.9](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.8...v0.0.0-pre.9) (2020-09-02)

### Features

- export api-helpers functions ([d723b85](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d723b85cd8745ee3631ad5976eecd0ae66e50e0a))

# [0.0.0-pre.4](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.3...v0.0.0-pre.4) (2020-07-27)

**Note:** Version bump only for package @smartthings/cli-testlib

# [0.0.0-pre.3](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.1-pre2...v0.0.0-pre.3) (2020-07-22)

**Note:** Version bump only for package @smartthings/cli-testlib
