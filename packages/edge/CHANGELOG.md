# @smartthings/plugin-cli-edge

## 2.0.0

### Patch Changes

- [#410](https://github.com/SmartThingsCommunity/smartthings-cli/pull/410) [`4bff9ea`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/4bff9eac6bac23daa0b995fb0be64d919e409b2c) Thanks [@rossiam](https://github.com/rossiam)! - incorporate edge plugin into monorepo

- [#427](https://github.com/SmartThingsCommunity/smartthings-cli/pull/427) [`5493e58`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/5493e58ad6e3ddea1491ffcf370b27cc90fecf6d) Thanks [@rossiam](https://github.com/rossiam)! - fix bug when changing drivers to an unsupported driver

- [#439](https://github.com/SmartThingsCommunity/smartthings-cli/pull/439) [`0ff4918`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0ff491827ee13d4dfe308792e19f1440422399dc) Thanks [@rossiam](https://github.com/rossiam)! - removed command aliases (`@oclif/plugin-notfound` plugin works much better now than it once did)

- [#412](https://github.com/SmartThingsCommunity/smartthings-cli/pull/412) [`e9ff59c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e9ff59ca0f5963d09b7193589762592af61db5e8) Thanks [@rossiam](https://github.com/rossiam)! - refactored `TableGenerator` interface and supporting code

- [#431](https://github.com/SmartThingsCommunity/smartthings-cli/pull/431) [`dd7cffc`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/dd7cffc9c30ee76c6c2b2a7a6dde171eacb0a937) Thanks [@rossiam](https://github.com/rossiam)! - fix sorting for edge:channels:drivers command

- [#435](https://github.com/SmartThingsCommunity/smartthings-cli/pull/435) [`2c889a2`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2c889a2d61d3ddacf7589c5a298644034777e2b3) Thanks [@rossiam](https://github.com/rossiam)! - output fewer columns when listing channels to make the list fit on the screen better

- [#432](https://github.com/SmartThingsCommunity/smartthings-cli/pull/432) [`1478253`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/147825356f3f2805650c034e9237c4b249675a61) Thanks [@rossiam](https://github.com/rossiam)! - add --verbose option to edge:drivers:installed command to include channel name

- [#418](https://github.com/SmartThingsCommunity/smartthings-cli/pull/418) [`ec1744e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ec1744e21b973f9b10a929e67d9dbd4c3e8c5e5f) Thanks [@rossiam](https://github.com/rossiam)! - fixed edge plugin source links in README

- Updated dependencies [[`4464873`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/44648732d54093a1e9f842dfb99dfe8bc81ea131), [`7e3a1b8`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/7e3a1b83d6c301aa86fe35d5660cfadde2bcfaf1), [`356a24b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/356a24be75a467f82f627a654dd6a1c8b83c56f8), [`d20ad61`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d20ad6198f663a5ecb04af1d80ccf42d10214fa9), [`d4730e0`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d4730e00712ddb18b916295b138301afaa8c23eb), [`2ed225f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2ed225f6fd4843aad4550634d49facb87ede7c7d), [`efc1eed`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/efc1eed852a61399342b5040c2d60561bbfb17af), [`a77e73b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a77e73b4348e4a3d65798e2711fbb40ecf0a139d), [`d0fd25d`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d0fd25d12158214c051584a19efb260f938204ce), [`688082f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/688082fe6d0e12e0e510b5c238de61b46bfddc08), [`e9ff59c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e9ff59ca0f5963d09b7193589762592af61db5e8), [`1e0bae5`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/1e0bae5d33dbb2ca967ab18677616b407baf86fe), [`ea04f1e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ea04f1ed890201608f921979c0c3b3a647ce6e59), [`2ed225f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2ed225f6fd4843aad4550634d49facb87ede7c7d), [`0849c4e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0849c4e36f81816cce8c6204c339424a8211c556), [`82652c9`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/82652c9a2fc144ee253e256718f034b47aeca7fc), [`47b27d2`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/47b27d2e2d74324a199302f6709ef698599a984c), [`d91418c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d91418caa5d54f984728ed02520338ac2410eae6), [`3523e38`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3523e38aa4b47f0a411b7969fb1771bbb7c50900), [`22b9a78`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/22b9a78570d44e4df8adfd265c95148c2e29256b), [`97f5c32`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/97f5c32db1be3b96ed7fc637ade3c1e209300ff5), [`b0cb399`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/b0cb3990dc07b0072d50802de95168acb4e94467), [`4677218`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/46772188ff8a7d432757a871aa49272c86b28e64), [`975c037`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/975c037c7983a1073eb6bf9f133e0f99599342df), [`594b5c7`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/594b5c73b3803e6f7f4e47fa175e5aee5df4f250)]:
  - @smartthings/cli-lib@1.0.0

## 2.0.0-beta.5

### Patch Changes

- [#439](https://github.com/SmartThingsCommunity/smartthings-cli/pull/439) [`0ff4918`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0ff491827ee13d4dfe308792e19f1440422399dc) Thanks [@rossiam](https://github.com/rossiam)! - removed command aliases (`@oclif/plugin-notfound` plugin works much better now than it once did)

## 2.0.0-beta.4

### Patch Changes

- [#435](https://github.com/SmartThingsCommunity/smartthings-cli/pull/435) [`2c889a2`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2c889a2d61d3ddacf7589c5a298644034777e2b3) Thanks [@rossiam](https://github.com/rossiam)! - output fewer columns when listing channels to make the list fit on the screen better

## 2.0.0-beta.3

### Patch Changes

- [#427](https://github.com/SmartThingsCommunity/smartthings-cli/pull/427) [`5493e58`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/5493e58ad6e3ddea1491ffcf370b27cc90fecf6d) Thanks [@rossiam](https://github.com/rossiam)! - fix bug when changing drivers to an unsupported driver

- [#412](https://github.com/SmartThingsCommunity/smartthings-cli/pull/412) [`e9ff59c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e9ff59ca0f5963d09b7193589762592af61db5e8) Thanks [@rossiam](https://github.com/rossiam)! - refactored `TableGenerator` interface and supporting code

- [#431](https://github.com/SmartThingsCommunity/smartthings-cli/pull/431) [`dd7cffc`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/dd7cffc9c30ee76c6c2b2a7a6dde171eacb0a937) Thanks [@rossiam](https://github.com/rossiam)! - fix sorting for edge:channels:drivers command

- [#432](https://github.com/SmartThingsCommunity/smartthings-cli/pull/432) [`1478253`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/147825356f3f2805650c034e9237c4b249675a61) Thanks [@rossiam](https://github.com/rossiam)! - add --verbose option to edge:drivers:installed command to include channel name

- Updated dependencies [[`e9ff59c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e9ff59ca0f5963d09b7193589762592af61db5e8)]:
  - @smartthings/cli-lib@1.0.0-beta.17

## 2.0.0-beta.2

### Patch Changes

- [#418](https://github.com/SmartThingsCommunity/smartthings-cli/pull/418) [`ec1744e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ec1744e21b973f9b10a929e67d9dbd4c3e8c5e5f) Thanks [@rossiam](https://github.com/rossiam)! - fixed edge plugin source links in README

## 2.0.0-beta.1

### Patch Changes

- [#410](https://github.com/SmartThingsCommunity/smartthings-cli/pull/410) [`4bff9ea`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/4bff9eac6bac23daa0b995fb0be64d919e409b2c) Thanks [@rossiam](https://github.com/rossiam)! - incorporate edge plugin into monorepo
