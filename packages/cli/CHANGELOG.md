# Change Log

## 1.1.0

### Minor Changes

- [#462](https://github.com/SmartThingsCommunity/smartthings-cli/pull/462) [`b03292d`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/b03292dffcab45dfc8b8fdb915ce5b198824e491) Thanks [@Sitlintac](https://github.com/Sitlintac)! - enable verbose flag when getting a single device

  add helper method to get location and room names for a single item

### Patch Changes

- [#454](https://github.com/SmartThingsCommunity/smartthings-cli/pull/454) [`0e94827`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0e948270a6638b0b414143ea90963baced08d7ed) Thanks [@rossiam](https://github.com/rossiam)! - allow more history recall when using JSON or YAML output

- Updated dependencies [[`b03292d`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/b03292dffcab45dfc8b8fdb915ce5b198824e491)]:
  - @smartthings/cli-lib@1.1.0

## 1.0.1

### Patch Changes

- [#448](https://github.com/SmartThingsCommunity/smartthings-cli/pull/448) [`c615772`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/c6157720531cb9383fcf74c4eea607cbf1971770) Thanks [@rossiam](https://github.com/rossiam)! - fixed error handling stdin when not run from the console

- Updated dependencies [[`c615772`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/c6157720531cb9383fcf74c4eea607cbf1971770), [`712476c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/712476c0166c030ce94f04bf89a0893f00204bc1)]:
  - @smartthings/cli-lib@1.0.1
  - @smartthings/plugin-cli-edge@2.0.1

## 1.0.0

### Minor Changes

- [#279](https://github.com/SmartThingsCommunity/smartthings-cli/pull/279) [`08ea9dd`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/08ea9dd52e7af829ba0629d9e7c9a89a7505baca) Thanks [@rossiam](https://github.com/rossiam)! - support saving default hub and channel

### Patch Changes

- [#309](https://github.com/SmartThingsCommunity/smartthings-cli/pull/309) [`7e3a1b8`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/7e3a1b83d6c301aa86fe35d5660cfadde2bcfaf1) Thanks [@john-u](https://github.com/john-u)! - - shutdown logger before Node exits

  - update @oclif deps to latest
  - replace process exits with command errors

- [#356](https://github.com/SmartThingsCommunity/smartthings-cli/pull/356) [`97f5c32`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/97f5c32db1be3b96ed7fc637ade3c1e209300ff5) Thanks [@john-u](https://github.com/john-u)! - bump log4js to resolve vulnerability

- [#294](https://github.com/SmartThingsCommunity/smartthings-cli/pull/294) [`356a24b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/356a24be75a467f82f627a654dd6a1c8b83c56f8) Thanks [@john-u](https://github.com/john-u)! - Add ability to enable debug logging (to console) via env variable.

- [#410](https://github.com/SmartThingsCommunity/smartthings-cli/pull/410) [`4bff9ea`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/4bff9eac6bac23daa0b995fb0be64d919e409b2c) Thanks [@rossiam](https://github.com/rossiam)! - incorporate edge plugin into monorepo

- [#407](https://github.com/SmartThingsCommunity/smartthings-cli/pull/407) [`f2ebdc2`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/f2ebdc21ee1f6b369c0479c2546f34b1f3e5b228) Thanks [@john-u](https://github.com/john-u)! - Add build support for macos-arm64, linux-arm64, and linuxstatic-armv7

- [#398](https://github.com/SmartThingsCommunity/smartthings-cli/pull/398) [`d20ad61`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d20ad6198f663a5ecb04af1d80ccf42d10214fa9) Thanks [@rossiam](https://github.com/rossiam)! - IMPORTANT: removed `-id` suffix from command line flags that had them for consistency

- [#374](https://github.com/SmartThingsCommunity/smartthings-cli/pull/374) [`aeb8b28`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/aeb8b2892ca4de80fd4335a7ed1e8af2ed5153c4) Thanks [@bflorian](https://github.com/bflorian)! - feat: added device and location history commands

- [#306](https://github.com/SmartThingsCommunity/smartthings-cli/pull/306) [`d4730e0`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d4730e00712ddb18b916295b138301afaa8c23eb) Thanks [@john-u](https://github.com/john-u)! - add debug logging to defualt login authenticator

- [#369](https://github.com/SmartThingsCommunity/smartthings-cli/pull/369) [`d62c051`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d62c0517d6947db55cd0c701e3c8ba194efaf201) Thanks [@bflorian](https://github.com/bflorian)! - feat: Refactored devices command and added health and status flags.

- [#382](https://github.com/SmartThingsCommunity/smartthings-cli/pull/382) [`3bda890`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3bda89049474fe4137bfc75c4d7c6edd6ff79f02) Thanks [@rossiam](https://github.com/rossiam)! - fix broken edge commands

- [#284](https://github.com/SmartThingsCommunity/smartthings-cli/pull/284) [`51a9c9a`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/51a9c9abec2e05d626979cb8dd59c24f88b01ef7) Thanks [@rossiam](https://github.com/rossiam)! - build fix (don't remove compiled files before publish)

- [#274](https://github.com/SmartThingsCommunity/smartthings-cli/pull/274) [`efc1eed`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/efc1eed852a61399342b5040c2d60561bbfb17af) Thanks [@john-u](https://github.com/john-u)! - replace usage of lodash with native ES or separate lodash modules

- [#427](https://github.com/SmartThingsCommunity/smartthings-cli/pull/427) [`5493e58`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/5493e58ad6e3ddea1491ffcf370b27cc90fecf6d) Thanks [@rossiam](https://github.com/rossiam)! - fix bug when changing drivers to an unsupported driver

- [#394](https://github.com/SmartThingsCommunity/smartthings-cli/pull/394) [`e13f0c3`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e13f0c33902289083ced4a6c6642685e6832a4d6) Thanks [@rossiam](https://github.com/rossiam)! - \* fix vendor support information output for edge:drivers:installed command

  - fix lookup by index for edge:drivers:installed command

- [#439](https://github.com/SmartThingsCommunity/smartthings-cli/pull/439) [`0ff4918`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0ff491827ee13d4dfe308792e19f1440422399dc) Thanks [@rossiam](https://github.com/rossiam)! - removed command aliases (`@oclif/plugin-notfound` plugin works much better now than it once did)

- [#355](https://github.com/SmartThingsCommunity/smartthings-cli/pull/355) [`a7bf89d`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a7bf89d606d71b2e7494555a2e4c078b539df50f) Thanks [@rossiam](https://github.com/rossiam)! - minor cleanup of capabilities table output

- [#361](https://github.com/SmartThingsCommunity/smartthings-cli/pull/361) [`688082f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/688082fe6d0e12e0e510b5c238de61b46bfddc08) Thanks [@bflorian](https://github.com/bflorian)! - Add userEmail field to ST Schema apps

- [#301](https://github.com/SmartThingsCommunity/smartthings-cli/pull/301) [`6ad407a`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/6ad407a0e98b4125ff8bbdd1ed237b8e9f81e8ca) Thanks [@john-u](https://github.com/john-u)! - bump @smartthings/plugin-cli-edge

- [#339](https://github.com/SmartThingsCommunity/smartthings-cli/pull/339) [`0849c4e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0849c4e36f81816cce8c6204c339424a8211c556) Thanks [@rossiam](https://github.com/rossiam)! - Update table output: - switch to table package which handles international characters properly - removed compact / expanded command line options - removed compactTableOutput configuration option - added group-rows and no-group-rows command line options - added groupTableOutputRows configuration option - (lib) completely isolated use of dependency to table-generator.ts

- [#351](https://github.com/SmartThingsCommunity/smartthings-cli/pull/351) [`e8852ab`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e8852ababae0b14d664737cd9e818dbd73b64dd0) Thanks [@Sitlintac](https://github.com/Sitlintac)! - enable multiple types when filtering devices

- [#431](https://github.com/SmartThingsCommunity/smartthings-cli/pull/431) [`dd7cffc`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/dd7cffc9c30ee76c6c2b2a7a6dde171eacb0a937) Thanks [@rossiam](https://github.com/rossiam)! - fix sorting for edge:channels:drivers command

- [#400](https://github.com/SmartThingsCommunity/smartthings-cli/pull/400) [`eb1aab8`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/eb1aab896d4248d293c662317056097aad777438) Thanks [@rossiam](https://github.com/rossiam)! - removed `-id` suffix from flags, update help text to reflect this

- [#381](https://github.com/SmartThingsCommunity/smartthings-cli/pull/381) [`852cdd7`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/852cdd748497f66628c6ef810a312594731efe48) Thanks [@john-u](https://github.com/john-u)! - resolve logcat command bug that was ignoring all messages from the hub

- [#327](https://github.com/SmartThingsCommunity/smartthings-cli/pull/327) [`82652c9`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/82652c9a2fc144ee253e256718f034b47aeca7fc) Thanks [@bflorian](https://github.com/bflorian)! - Added commands to create virtual devices and generate events on their behalf

- [#417](https://github.com/SmartThingsCommunity/smartthings-cli/pull/417) [`5a90f2e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/5a90f2e36ddca09f962d546c4dc8fe474b844549) Thanks [@rossiam](https://github.com/rossiam)! - fix issue with creating capabilities with commands with no arguments

- [#435](https://github.com/SmartThingsCommunity/smartthings-cli/pull/435) [`2c889a2`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2c889a2d61d3ddacf7589c5a298644034777e2b3) Thanks [@rossiam](https://github.com/rossiam)! - output fewer columns when listing channels to make the list fit on the screen better

- [#347](https://github.com/SmartThingsCommunity/smartthings-cli/pull/347) [`76ba4c5`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/76ba4c50090abe4f330d269eccd041dd71c562df) Thanks [@john-u](https://github.com/john-u)! - Add Windows installer build

- [#386](https://github.com/SmartThingsCommunity/smartthings-cli/pull/386) [`34b91ab`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/34b91ab734e7db8d27344ba4f95ab65091b1f161) Thanks [@bflorian](https://github.com/bflorian)! - fix - fixed bug in capability translation output

- [#313](https://github.com/SmartThingsCommunity/smartthings-cli/pull/313) [`3aa7e60`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3aa7e6071b451818670b7553491e73557cad72b3) Thanks [@rossiam](https://github.com/rossiam)! - - edge:drivers:package command - log error when broken symlink is encountered

  - edge:drivers:package command - log error when symlink to directory is encountered
  - added edge:drivers:switch command for switching driver used by a device

- [#371](https://github.com/SmartThingsCommunity/smartthings-cli/pull/371) [`b2ea4c0`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/b2ea4c04c626e2991b9f6a400656ab764f700f93) Thanks [@rossiam](https://github.com/rossiam)! - include virtual device info in device output

- [#432](https://github.com/SmartThingsCommunity/smartthings-cli/pull/432) [`1478253`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/147825356f3f2805650c034e9237c4b249675a61) Thanks [@rossiam](https://github.com/rossiam)! - add --verbose option to edge:drivers:installed command to include channel name

- [#375](https://github.com/SmartThingsCommunity/smartthings-cli/pull/375) [`3523e38`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3523e38aa4b47f0a411b7969fb1771bbb7c50900) Thanks [@john-u](https://github.com/john-u)! - bump @smartthings/plugin-cli-edge to support newer oclif/core version

- [#282](https://github.com/SmartThingsCommunity/smartthings-cli/pull/282) [`48236e7`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/48236e7f19a17b7b36d42a6741ec5adb11d32cee) Thanks [@rossiam](https://github.com/rossiam)! - Updated pkg tool used to build binaries and target Node 16.

- [#367](https://github.com/SmartThingsCommunity/smartthings-cli/pull/367) [`22b9a78`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/22b9a78570d44e4df8adfd265c95148c2e29256b) Thanks [@john-u](https://github.com/john-u)! - pin dependency to resolve timeout error

- [#348](https://github.com/SmartThingsCommunity/smartthings-cli/pull/348) [`d1ee1c1`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d1ee1c1717720f3a55099dddd2b92bed9668bfc2) Thanks [@Sitlintac](https://github.com/Sitlintac)! - feat: add verbose ability to rooms command

  - reorder columns in table output
  - add test

- [#392](https://github.com/SmartThingsCommunity/smartthings-cli/pull/392) [`594b5c7`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/594b5c73b3803e6f7f4e47fa175e5aee5df4f250) Thanks [@rossiam](https://github.com/rossiam)! - include location name for installedapps and installedschema when querying a single item in verbose mode

- [#414](https://github.com/SmartThingsCommunity/smartthings-cli/pull/414) [`206c4a1`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/206c4a1070ce91e97e421c57d759c1d03c6adf3b) Thanks [@john-u](https://github.com/john-u)! - switch Windows archive format back to zip

- [#278](https://github.com/SmartThingsCommunity/smartthings-cli/pull/278) [`b0cb399`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/b0cb3990dc07b0072d50802de95168acb4e94467) Thanks [@john-u](https://github.com/john-u)! - update oclif packages

- [#335](https://github.com/SmartThingsCommunity/smartthings-cli/pull/335) [`975c037`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/975c037c7983a1073eb6bf9f133e0f99599342df) Thanks [@john-u](https://github.com/john-u)! - update @smartthings/core-sdk to 5.0.0

- Updated dependencies [[`4464873`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/44648732d54093a1e9f842dfb99dfe8bc81ea131), [`7e3a1b8`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/7e3a1b83d6c301aa86fe35d5660cfadde2bcfaf1), [`356a24b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/356a24be75a467f82f627a654dd6a1c8b83c56f8), [`4bff9ea`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/4bff9eac6bac23daa0b995fb0be64d919e409b2c), [`d20ad61`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d20ad6198f663a5ecb04af1d80ccf42d10214fa9), [`d4730e0`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d4730e00712ddb18b916295b138301afaa8c23eb), [`2ed225f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2ed225f6fd4843aad4550634d49facb87ede7c7d), [`efc1eed`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/efc1eed852a61399342b5040c2d60561bbfb17af), [`5493e58`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/5493e58ad6e3ddea1491ffcf370b27cc90fecf6d), [`a77e73b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a77e73b4348e4a3d65798e2711fbb40ecf0a139d), [`0ff4918`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0ff491827ee13d4dfe308792e19f1440422399dc), [`d0fd25d`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d0fd25d12158214c051584a19efb260f938204ce), [`688082f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/688082fe6d0e12e0e510b5c238de61b46bfddc08), [`e9ff59c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e9ff59ca0f5963d09b7193589762592af61db5e8), [`1e0bae5`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/1e0bae5d33dbb2ca967ab18677616b407baf86fe), [`ea04f1e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ea04f1ed890201608f921979c0c3b3a647ce6e59), [`2ed225f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2ed225f6fd4843aad4550634d49facb87ede7c7d), [`0849c4e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0849c4e36f81816cce8c6204c339424a8211c556), [`dd7cffc`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/dd7cffc9c30ee76c6c2b2a7a6dde171eacb0a937), [`82652c9`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/82652c9a2fc144ee253e256718f034b47aeca7fc), [`47b27d2`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/47b27d2e2d74324a199302f6709ef698599a984c), [`2c889a2`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2c889a2d61d3ddacf7589c5a298644034777e2b3), [`d91418c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d91418caa5d54f984728ed02520338ac2410eae6), [`1478253`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/147825356f3f2805650c034e9237c4b249675a61), [`3523e38`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3523e38aa4b47f0a411b7969fb1771bbb7c50900), [`22b9a78`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/22b9a78570d44e4df8adfd265c95148c2e29256b), [`97f5c32`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/97f5c32db1be3b96ed7fc637ade3c1e209300ff5), [`b0cb399`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/b0cb3990dc07b0072d50802de95168acb4e94467), [`ec1744e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ec1744e21b973f9b10a929e67d9dbd4c3e8c5e5f), [`4677218`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/46772188ff8a7d432757a871aa49272c86b28e64), [`975c037`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/975c037c7983a1073eb6bf9f133e0f99599342df), [`594b5c7`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/594b5c73b3803e6f7f4e47fa175e5aee5df4f250)]:
  - @smartthings/cli-lib@1.0.0
  - @smartthings/plugin-cli-edge@2.0.0

## 1.0.0-beta.23

### Patch Changes

- [#439](https://github.com/SmartThingsCommunity/smartthings-cli/pull/439) [`0ff4918`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0ff491827ee13d4dfe308792e19f1440422399dc) Thanks [@rossiam](https://github.com/rossiam)! - removed command aliases (`@oclif/plugin-notfound` plugin works much better now than it once did)

- Updated dependencies [[`0ff4918`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0ff491827ee13d4dfe308792e19f1440422399dc)]:
  - @smartthings/plugin-cli-edge@2.0.0-beta.5

## 1.0.0-beta.22

### Patch Changes

- [#435](https://github.com/SmartThingsCommunity/smartthings-cli/pull/435) [`2c889a2`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2c889a2d61d3ddacf7589c5a298644034777e2b3) Thanks [@rossiam](https://github.com/rossiam)! - output fewer columns when listing channels to make the list fit on the screen better

- Updated dependencies [[`2c889a2`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2c889a2d61d3ddacf7589c5a298644034777e2b3)]:
  - @smartthings/plugin-cli-edge@2.0.0-beta.4

## 1.0.0-beta.21

### Patch Changes

- [#427](https://github.com/SmartThingsCommunity/smartthings-cli/pull/427) [`5493e58`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/5493e58ad6e3ddea1491ffcf370b27cc90fecf6d) Thanks [@rossiam](https://github.com/rossiam)! - fix bug when changing drivers to an unsupported driver

- [#431](https://github.com/SmartThingsCommunity/smartthings-cli/pull/431) [`dd7cffc`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/dd7cffc9c30ee76c6c2b2a7a6dde171eacb0a937) Thanks [@rossiam](https://github.com/rossiam)! - fix sorting for edge:channels:drivers command

- [#432](https://github.com/SmartThingsCommunity/smartthings-cli/pull/432) [`1478253`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/147825356f3f2805650c034e9237c4b249675a61) Thanks [@rossiam](https://github.com/rossiam)! - add --verbose option to edge:drivers:installed command to include channel name

- Updated dependencies [[`5493e58`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/5493e58ad6e3ddea1491ffcf370b27cc90fecf6d), [`e9ff59c`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e9ff59ca0f5963d09b7193589762592af61db5e8), [`dd7cffc`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/dd7cffc9c30ee76c6c2b2a7a6dde171eacb0a937), [`1478253`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/147825356f3f2805650c034e9237c4b249675a61)]:
  - @smartthings/plugin-cli-edge@2.0.0-beta.3
  - @smartthings/cli-lib@1.0.0-beta.17

## 1.0.0-beta.20

### Patch Changes

- [#417](https://github.com/SmartThingsCommunity/smartthings-cli/pull/417) [`5a90f2e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/5a90f2e36ddca09f962d546c4dc8fe474b844549) Thanks [@rossiam](https://github.com/rossiam)! - fix issue with creating capabilities with commands with no arguments

- [#414](https://github.com/SmartThingsCommunity/smartthings-cli/pull/414) [`206c4a1`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/206c4a1070ce91e97e421c57d759c1d03c6adf3b) Thanks [@john-u](https://github.com/john-u)! - switch Windows archive format back to zip

- Updated dependencies [[`ec1744e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ec1744e21b973f9b10a929e67d9dbd4c3e8c5e5f)]:
  - @smartthings/plugin-cli-edge@2.0.0-beta.2

## 1.0.0-beta.19

### Patch Changes

- [#410](https://github.com/SmartThingsCommunity/smartthings-cli/pull/410) [`4bff9ea`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/4bff9eac6bac23daa0b995fb0be64d919e409b2c) Thanks [@rossiam](https://github.com/rossiam)! - incorporate edge plugin into monorepo

- Updated dependencies [[`4bff9ea`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/4bff9eac6bac23daa0b995fb0be64d919e409b2c)]:
  - @smartthings/plugin-cli-edge@2.0.0-beta.1

## 1.0.0-beta.18

### Patch Changes

- [#407](https://github.com/SmartThingsCommunity/smartthings-cli/pull/407) [`f2ebdc2`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/f2ebdc21ee1f6b369c0479c2546f34b1f3e5b228) Thanks [@john-u](https://github.com/john-u)! - Add build support for macos-arm64, linux-arm64, and linuxstatic-armv7

## 1.0.0-beta.17

### Patch Changes

- [#398](https://github.com/SmartThingsCommunity/smartthings-cli/pull/398) [`d20ad61`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d20ad6198f663a5ecb04af1d80ccf42d10214fa9) Thanks [@rossiam](https://github.com/rossiam)! - IMPORTANT: removed `-id` suffix from command line flags that had them for consistency

* [#394](https://github.com/SmartThingsCommunity/smartthings-cli/pull/394) [`e13f0c3`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e13f0c33902289083ced4a6c6642685e6832a4d6) Thanks [@rossiam](https://github.com/rossiam)! - \* fix vendor support information output for edge:drivers:installed command
  - fix lookup by index for edge:drivers:installed command

- [#400](https://github.com/SmartThingsCommunity/smartthings-cli/pull/400) [`eb1aab8`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/eb1aab896d4248d293c662317056097aad777438) Thanks [@rossiam](https://github.com/rossiam)! - removed `-id` suffix from flags, update help text to reflect this

* [#392](https://github.com/SmartThingsCommunity/smartthings-cli/pull/392) [`594b5c7`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/594b5c73b3803e6f7f4e47fa175e5aee5df4f250) Thanks [@rossiam](https://github.com/rossiam)! - include location name for installedapps and installedschema when querying a single item in verbose mode

* Updated dependencies [[`d20ad61`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d20ad6198f663a5ecb04af1d80ccf42d10214fa9), [`594b5c7`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/594b5c73b3803e6f7f4e47fa175e5aee5df4f250)]:
  - @smartthings/cli-lib@1.0.0-beta.15

## 1.0.0-beta.16

### Patch Changes

- [#386](https://github.com/SmartThingsCommunity/smartthings-cli/pull/386) [`34b91ab`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/34b91ab734e7db8d27344ba4f95ab65091b1f161) Thanks [@bflorian](https://github.com/bflorian)! - fix - fixed bug in capability translation output

## 1.0.0-beta.15

### Patch Changes

- [#382](https://github.com/SmartThingsCommunity/smartthings-cli/pull/382) [`3bda890`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3bda89049474fe4137bfc75c4d7c6edd6ff79f02) Thanks [@rossiam](https://github.com/rossiam)! - fix broken edge commands

## 1.0.0-beta.14

### Patch Changes

- [#381](https://github.com/SmartThingsCommunity/smartthings-cli/pull/381) [`852cdd7`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/852cdd748497f66628c6ef810a312594731efe48) Thanks [@john-u](https://github.com/john-u)! - resolve logcat command bug that was ignoring all messages from the hub

- Updated dependencies [[`ea04f1e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ea04f1ed890201608f921979c0c3b3a647ce6e59)]:
  - @smartthings/cli-lib@1.0.0-beta.14

## 1.0.0-beta.13

### Patch Changes

- [#374](https://github.com/SmartThingsCommunity/smartthings-cli/pull/374) [`aeb8b28`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/aeb8b2892ca4de80fd4335a7ed1e8af2ed5153c4) Thanks [@bflorian](https://github.com/bflorian)! - feat: added device and location history commands

* [#369](https://github.com/SmartThingsCommunity/smartthings-cli/pull/369) [`d62c051`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d62c0517d6947db55cd0c701e3c8ba194efaf201) Thanks [@bflorian](https://github.com/bflorian)! - feat: Refactored devices command and added health and status flags.

- [#371](https://github.com/SmartThingsCommunity/smartthings-cli/pull/371) [`b2ea4c0`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/b2ea4c04c626e2991b9f6a400656ab764f700f93) Thanks [@rossiam](https://github.com/rossiam)! - include virtual device info in device output

* [#375](https://github.com/SmartThingsCommunity/smartthings-cli/pull/375) [`3523e38`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3523e38aa4b47f0a411b7969fb1771bbb7c50900) Thanks [@john-u](https://github.com/john-u)! - bump @smartthings/plugin-cli-edge to support newer oclif/core version

* Updated dependencies [[`3523e38`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3523e38aa4b47f0a411b7969fb1771bbb7c50900)]:
  - @smartthings/cli-lib@1.0.0-beta.13

## 1.0.0-beta.12

### Patch Changes

- [#355](https://github.com/SmartThingsCommunity/smartthings-cli/pull/355) [`a7bf89d`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a7bf89d606d71b2e7494555a2e4c078b539df50f) Thanks [@rossiam](https://github.com/rossiam)! - minor cleanup of capabilities table output

* [#361](https://github.com/SmartThingsCommunity/smartthings-cli/pull/361) [`688082f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/688082fe6d0e12e0e510b5c238de61b46bfddc08) Thanks [@bflorian](https://github.com/bflorian)! - Add userEmail field to ST Schema apps

- [#367](https://github.com/SmartThingsCommunity/smartthings-cli/pull/367) [`22b9a78`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/22b9a78570d44e4df8adfd265c95148c2e29256b) Thanks [@john-u](https://github.com/john-u)! - pin dependency to resolve timeout error

- Updated dependencies [[`688082f`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/688082fe6d0e12e0e510b5c238de61b46bfddc08), [`47b27d2`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/47b27d2e2d74324a199302f6709ef698599a984c), [`22b9a78`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/22b9a78570d44e4df8adfd265c95148c2e29256b)]:
  - @smartthings/cli-lib@1.0.0-beta.12

## 1.0.0-beta.11

### Patch Changes

- [#356](https://github.com/SmartThingsCommunity/smartthings-cli/pull/356) [`97f5c32`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/97f5c32db1be3b96ed7fc637ade3c1e209300ff5) Thanks [@john-u](https://github.com/john-u)! - bump log4js to resolve vulnerability

* [#351](https://github.com/SmartThingsCommunity/smartthings-cli/pull/351) [`e8852ab`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e8852ababae0b14d664737cd9e818dbd73b64dd0) Thanks [@Sitlintac](https://github.com/Sitlintac)! - enable multiple types when filtering devices

* Updated dependencies [[`97f5c32`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/97f5c32db1be3b96ed7fc637ade3c1e209300ff5)]:
  - @smartthings/cli-lib@1.0.0-beta.11

## 1.0.0-beta.10

### Patch Changes

- [#347](https://github.com/SmartThingsCommunity/smartthings-cli/pull/347) [`76ba4c5`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/76ba4c50090abe4f330d269eccd041dd71c562df) Thanks [@john-u](https://github.com/john-u)! - Add Windows installer build

* [#348](https://github.com/SmartThingsCommunity/smartthings-cli/pull/348) [`d1ee1c1`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d1ee1c1717720f3a55099dddd2b92bed9668bfc2) Thanks [@Sitlintac](https://github.com/Sitlintac)! - feat: add verbose ability to rooms command
  - reorder columns in table output
  - add test

## 1.0.0-beta.9

### Patch Changes

- [#339](https://github.com/SmartThingsCommunity/smartthings-cli/pull/339) [`0849c4e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0849c4e36f81816cce8c6204c339424a8211c556) Thanks [@rossiam](https://github.com/rossiam)! - Update table output: - switch to table package which handles international characters properly - removed compact / expanded command line options - removed compactTableOutput configuration option - added group-rows and no-group-rows command line options - added groupTableOutputRows configuration option - (lib) completely isolated use of dependency to table-generator.ts

* [#327](https://github.com/SmartThingsCommunity/smartthings-cli/pull/327) [`82652c9`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/82652c9a2fc144ee253e256718f034b47aeca7fc) Thanks [@bflorian](https://github.com/bflorian)! - Added commands to create virtual devices and generate events on their behalf

- [#335](https://github.com/SmartThingsCommunity/smartthings-cli/pull/335) [`975c037`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/975c037c7983a1073eb6bf9f133e0f99599342df) Thanks [@john-u](https://github.com/john-u)! - update @smartthings/core-sdk to 5.0.0

- Updated dependencies [[`0849c4e`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0849c4e36f81816cce8c6204c339424a8211c556), [`82652c9`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/82652c9a2fc144ee253e256718f034b47aeca7fc), [`975c037`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/975c037c7983a1073eb6bf9f133e0f99599342df)]:
  - @smartthings/cli-lib@1.0.0-beta.10

## 1.0.0-beta.8

### Patch Changes

- [#309](https://github.com/SmartThingsCommunity/smartthings-cli/pull/309) [`7e3a1b8`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/7e3a1b83d6c301aa86fe35d5660cfadde2bcfaf1) Thanks [@john-u](https://github.com/john-u)! - - shutdown logger before Node exits
  - update @oclif deps to latest
  - replace process exits with command errors

* [#313](https://github.com/SmartThingsCommunity/smartthings-cli/pull/313) [`3aa7e60`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3aa7e6071b451818670b7553491e73557cad72b3) Thanks [@rossiam](https://github.com/rossiam)! - - edge:drivers:package command - log error when broken symlink is encountered
  - edge:drivers:package command - log error when symlink to directory is encountered
  - added edge:drivers:switch command for switching driver used by a device
* Updated dependencies [[`7e3a1b8`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/7e3a1b83d6c301aa86fe35d5660cfadde2bcfaf1)]:
  - @smartthings/cli-lib@1.0.0-beta.8

## 1.0.0-beta.7

### Patch Changes

- [#306](https://github.com/SmartThingsCommunity/smartthings-cli/pull/306) [`d4730e0`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d4730e00712ddb18b916295b138301afaa8c23eb) Thanks [@john-u](https://github.com/john-u)! - add debug logging to defualt login authenticator

- Updated dependencies [[`d4730e0`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d4730e00712ddb18b916295b138301afaa8c23eb)]:
  - @smartthings/cli-lib@1.0.0-beta.7

## 1.0.0-beta.6

### Patch Changes

- [#301](https://github.com/SmartThingsCommunity/smartthings-cli/pull/301) [`6ad407a`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/6ad407a0e98b4125ff8bbdd1ed237b8e9f81e8ca) Thanks [@john-u](https://github.com/john-u)! - bump @smartthings/plugin-cli-edge

## 1.0.0-beta.5

### Patch Changes

- [#294](https://github.com/SmartThingsCommunity/smartthings-cli/pull/294) [`356a24b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/356a24be75a467f82f627a654dd6a1c8b83c56f8) Thanks [@john-u](https://github.com/john-u)! - Add ability to enable debug logging (to console) via env variable.

- Updated dependencies [[`4464873`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/44648732d54093a1e9f842dfb99dfe8bc81ea131), [`356a24b`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/356a24be75a467f82f627a654dd6a1c8b83c56f8)]:
  - @smartthings/cli-lib@1.0.0-beta.5

## 1.0.0-beta.4

### Patch Changes

- [#284](https://github.com/SmartThingsCommunity/smartthings-cli/pull/284) [`51a9c9a`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/51a9c9abec2e05d626979cb8dd59c24f88b01ef7) Thanks [@rossiam](https://github.com/rossiam)! - build fix (don't remove compiled files before publish)

## 1.0.0-beta.3

### Patch Changes

- [#282](https://github.com/SmartThingsCommunity/smartthings-cli/pull/282) [`48236e7`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/48236e7f19a17b7b36d42a6741ec5adb11d32cee) Thanks [@rossiam](https://github.com/rossiam)! - Updated pkg tool used to build binaries and target Node 16.

## 1.0.0-beta.2

### Minor Changes

- [#279](https://github.com/SmartThingsCommunity/smartthings-cli/pull/279) [`08ea9dd`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/08ea9dd52e7af829ba0629d9e7c9a89a7505baca) Thanks [@rossiam](https://github.com/rossiam)! - support saving default hub and channel

## 1.0.0-beta.1

### Patch Changes

- [#274](https://github.com/SmartThingsCommunity/smartthings-cli/pull/274) [`efc1eed`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/efc1eed852a61399342b5040c2d60561bbfb17af) Thanks [@john-u](https://github.com/john-u)! - replace usage of lodash with native ES or separate lodash modules

* [#278](https://github.com/SmartThingsCommunity/smartthings-cli/pull/278) [`b0cb399`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/b0cb3990dc07b0072d50802de95168acb4e94467) Thanks [@john-u](https://github.com/john-u)! - update oclif packages

* Updated dependencies [[`efc1eed`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/efc1eed852a61399342b5040c2d60561bbfb17af), [`b0cb399`](https://github.com/SmartThingsCommunity/smartthings-cli/commit/b0cb3990dc07b0072d50802de95168acb4e94467)]:
  - @smartthings/cli-lib@1.0.0-beta.3

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-beta.0](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.41...v1.0.0-beta.0) (2022-03-10)

**Note:** Version bump only for package @smartthings/cli

# [1.0.0-beta.0](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.41...v1.0.0-beta.0) (2022-03-10)

**Note:** Version bump only for package @smartthings/cli

# [0.0.0-pre.41](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.40...v0.0.0-pre.41) (2022-03-07)

### Bug Fixes

- **deps:** bump plugin-cli-edge to 1.10.1 ([14d7ad3](https://github.com/SmartThingsCommunity/smartthings-cli/commit/14d7ad324216105dac2b3ad7b15e673207a63d3d))

# [0.0.0-pre.40](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.39...v0.0.0-pre.40) (2022-03-03)

### Bug Fixes

- **devicepreferences:** make create prompts more clear ([258b9da](https://github.com/SmartThingsCommunity/smartthings-cli/commit/258b9daa9fa8d7d5cf08a3034d944732ef2bade7))

### Features

- include unique User-Agent in client requests ([4886cc2](https://github.com/SmartThingsCommunity/smartthings-cli/commit/4886cc28f7925972aeacabc84b306f60c3fad7c1))

# [0.0.0-pre.39](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.38...v0.0.0-pre.39) (2022-02-18)

### Features

- add type filter to devices command; minor refactoring ([5ea91d7](https://github.com/SmartThingsCommunity/smartthings-cli/commit/5ea91d7825aa87383d0c2a832c4aee4f5e3a0f55))

# [0.0.0-pre.38](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.37...v0.0.0-pre.38) (2022-02-17)

### Bug Fixes

- **edge:** bump plugin-cli-edge to 1.8.1 ([813c903](https://github.com/SmartThingsCommunity/smartthings-cli/commit/813c90399341590af0259c03b3f09d56e2380380))

# [0.0.0-pre.37](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.36...v0.0.0-pre.37) (2022-02-11)

### Bug Fixes

- **deps:** update dependencies ([24d0c23](https://github.com/SmartThingsCommunity/smartthings-cli/commit/24d0c23462ec3bb6c4b8fd1e57fd5d27072efe94))

### Features

- hide uncommon flags from help to reduce clutter ([deaebb4](https://github.com/SmartThingsCommunity/smartthings-cli/commit/deaebb4074ac3b90e1d7d8362c538a0b1be27011))

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

- **edge:** bump edge version to 1.4.3 ([f34ff2b](https://github.com/SmartThingsCommunity/smartthings-cli/commit/f34ff2b6538fd359076d6316e1d929da5add4d43))
- scrub sensitive info from logging ([6b374f8](https://github.com/SmartThingsCommunity/smartthings-cli/commit/6b374f880f78f724f2dfb139f89c39c9188de7cf))

# [0.0.0-pre.31](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.30...v0.0.0-pre.31) (2021-10-07)

### Bug Fixes

- **README:** fix code links ([738357d](https://github.com/SmartThingsCommunity/smartthings-cli/commit/738357dfeba84ef1174790f76783f13449c381dc)), closes [#200](https://github.com/SmartThingsCommunity/smartthings-cli/issues/200)
- Don't consider lack of custom capabilities an error in list command ([514f14a](https://github.com/SmartThingsCommunity/smartthings-cli/commit/514f14ad5ba23657df71f4bc6741c3b6c6aa5f95))

# [0.0.0-pre.30](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.29...v0.0.0-pre.30) (2021-09-21)

### Features

- update edge plugin to v1.4.0 ([a096f7a](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a096f7a023c4661f3d43ce5dede216d0a1957c5e))

# [0.0.0-pre.29](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.28...v0.0.0-pre.29) (2021-09-10)

### Features

- Added schema:regenerate to create new client IDs and secrets ([8cc9d9a](https://github.com/SmartThingsCommunity/smartthings-cli/commit/8cc9d9a3a8e6f7e7fae61985685e635a9dd8bdef))

# [0.0.0-pre.28](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.27...v0.0.0-pre.28) (2021-08-19)

### Bug Fixes

- bump edge plugin version to 1.0.5 ([e86e904](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e86e90411fc4e160281be0bf4a3f4e2581d846a8))

# [0.0.0-pre.27](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.26...v0.0.0-pre.27) (2021-08-16)

### Bug Fixes

- Added output format flags to deviceprofiles:presentation ([2b93b48](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2b93b48fbe18fbaf06ca9d55a08e322c2bb65fe4))

### Features

- add edge commands plugin ([354ce95](https://github.com/SmartThingsCommunity/smartthings-cli/commit/354ce953dc524af7639a11069f53c91b0295db41))

# [0.0.0-pre.26](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.25...v0.0.0-pre.26) (2021-07-22)

### Bug Fixes

- Default schema authorization to the correct principal ([7c8a76c](https://github.com/SmartThingsCommunity/smartthings-cli/commit/7c8a76c7bf01b712af6e60d53701ecd7ac877e56))

### Features

- add support for device preferences commands ([d4ad86d](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d4ad86d92a1d7b29f7641bc3b1ab3961a510edc8))
- Added device preferences and capability units ([1d9b1c1](https://github.com/SmartThingsCommunity/smartthings-cli/commit/1d9b1c11054243c8e69c8a6dc4d4b817631f0b1b))

# [0.0.0-pre.25](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.24...v0.0.0-pre.25) (2021-05-24)

### Bug Fixes

- fixes to capability translations ([f8b7471](https://github.com/SmartThingsCommunity/smartthings-cli/commit/f8b7471127445ca6c68eaf629449c522080cd423))

### Features

- **LoginAuthenticator:** provide generic auth method ([ae82b6a](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ae82b6a7dc71e10377a20d03ec915a8fe81cdb9c))
- add device preferences output to device profiles ([fa53f10](https://github.com/SmartThingsCommunity/smartthings-cli/commit/fa53f10eec476fc7a07f832e5e95c2f081081d80))

# [0.0.0-pre.24](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.23...v0.0.0-pre.24) (2021-04-29)

### Features

- add logout command which just removes credential for now ([942d886](https://github.com/SmartThingsCommunity/smartthings-cli/commit/942d8863fee0ad5a5f2056f98468788ba5c937c4))

# [0.0.0-pre.23](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.22...v0.0.0-pre.23) (2021-04-23)

### Bug Fixes

- pin pkg to resolve missing commands ([03701dd](https://github.com/SmartThingsCommunity/smartthings-cli/commit/03701dd1b908e3986645ab8dab9017f768cc1cd1))

# [0.0.0-pre.22](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.21...v0.0.0-pre.22) (2021-04-21)

**Note:** Version bump only for package @smartthings/cli

# [0.0.0-pre.21](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.20...v0.0.0-pre.21) (2021-04-20)

**Note:** Version bump only for package @smartthings/cli

# [0.0.0-pre.20](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.19...v0.0.0-pre.20) (2021-04-12)

### Features

- Accept manufacturerName in device config command ([2a17dc4](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2a17dc4c2b2c638a85062e372e35df7bb375ece3))

# [0.0.0-pre.19](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.18...v0.0.0-pre.19) (2021-04-06)

### Features

- output JSON by default when not outputting to the console ([a0d91ff](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a0d91ff73d40131392fb57407c90ce01806b0424))

# [0.0.0-pre.18](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.17...v0.0.0-pre.18) (2021-02-01)

### Features

- Added commands to list, show, and delete installed ST schema instances ([3158d47](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3158d4715e7ec3f261af74429675f3afa97695e5))

# [0.0.0-pre.17](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.16...v0.0.0-pre.17) (2021-01-25)

**Note:** Version bump only for package @smartthings/cli

# [0.0.0-pre.16](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.15...v0.0.0-pre.16) (2021-01-22)

### Bug Fixes

- correct ordering of InputProcessor calls ([dd4dfd0](https://github.com/SmartThingsCommunity/smartthings-cli/commit/dd4dfd0938f6b6888ce1f0a48840d4b8b0ccdddf))
- Corrected bug display verbose apps table ([0b35655](https://github.com/SmartThingsCommunity/smartthings-cli/commit/0b35655fe0c46aeadf57817ec4d6a21d73a300c5))
- fix rules lookup without location id and functional refactor ([bfa67b6](https://github.com/SmartThingsCommunity/smartthings-cli/commit/bfa67b6167c32281825559c65e4f38e38ab1d863))
- use kebab case for all flags ([128dcbb](https://github.com/SmartThingsCommunity/smartthings-cli/commit/128dcbb25e292e179b6483ce76e42a4c3eb290c2))

### Features

- Added support for specifying a language header ([00f50b9](https://github.com/SmartThingsCommunity/smartthings-cli/commit/00f50b9d8aadf0275f4e6426d68207903e639829))

# [0.0.0-pre.15](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.14...v0.0.0-pre.15) (2020-12-21)

### Bug Fixes

- Added support for device presentation manufacturer name ([804eaaa](https://github.com/SmartThingsCommunity/smartthings-cli/commit/804eaaa906d965dd7e66aa98d3e66b166f90fe68))
- remove unnecessary node dependency in lib ([27c38e3](https://github.com/SmartThingsCommunity/smartthings-cli/commit/27c38e3fddb692b7985e77a0d5147f17f929558a))
- use InstalledApp fields in installedapps:rename and refactor to use new functional paradigm ([8170818](https://github.com/SmartThingsCommunity/smartthings-cli/commit/817081833d5d260f48a5fda1255b12ff631ca0da))

# [0.0.0-pre.14](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.13...v0.0.0-pre.14) (2020-12-07)

### Bug Fixes

- use default version of 1 when not id included in command line without version ([9acace0](https://github.com/SmartThingsCommunity/smartthings-cli/commit/9acace0b47388f552f2c50ed46f64c720b1176b9))
- validate capability command and attribute names ([794d592](https://github.com/SmartThingsCommunity/smartthings-cli/commit/794d5928c855dbbe7168479763cc33852c0e4c76))

### Features

- **logger:** default log file path to oclif cacheDir ([a1ce523](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a1ce523eac18c0ddda4c92bc627658bd394a0862))

# [0.0.0-pre.13](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.12...v0.0.0-pre.13) (2020-10-22)

### Features

- Added option to filter devices by installedAppId ([62628a8](https://github.com/SmartThingsCommunity/smartthings-cli/commit/62628a80ca9c0fcc78339f4f7ecb6122dde44f33))

# [0.0.0-pre.12](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.11...v0.0.0-pre.12) (2020-09-30)

### Bug Fixes

- fix issues with binary and node builds ([7989558](https://github.com/SmartThingsCommunity/smartthings-cli/commit/7989558c2cda5b1cf1c2f622285bee1445a54f66))

# [0.0.0-pre.11](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.10...v0.0.0-pre.11) (2020-09-28)

### Bug Fixes

- remove ambiguous log method ([5466cd6](https://github.com/SmartThingsCommunity/smartthings-cli/commit/5466cd6ad3ed8bf35ab79d40f7ec2023cbd81f62))
- Update to accommodate switch from vid to presentationId ([3756ed7](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3756ed74abf6feca1d0ba44518ebb85de3930904))

### Features

- added device profile and capability localizations ([6a48783](https://github.com/SmartThingsCommunity/smartthings-cli/commit/6a487830539eb3660358c8c448ce1de2e3465f8e))
- app list options and fixes to app and schema commands ([#101](https://github.com/SmartThingsCommunity/smartthings-cli/issues/101)) ([979e409](https://github.com/SmartThingsCommunity/smartthings-cli/commit/979e409c27e8ed9eb33c6fadad65a1811cf413ef))
- use separate file for logging config ([80b3005](https://github.com/SmartThingsCommunity/smartthings-cli/commit/80b30051abb6670ea36f479e18c202fb3bf7b289))

# [0.0.0-pre.10](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.9...v0.0.0-pre.10) (2020-09-02)

### Bug Fixes

- bump core-sdk and log4js versions ([2a3f9ff](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2a3f9fffdabbf5f5babb0cc4aaffe648ddd7ebd8))

# [0.0.0-pre.9](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.8...v0.0.0-pre.9) (2020-09-02)

### Features

- added prompted device profile creation and device view commands ([#95](https://github.com/SmartThingsCommunity/smartthings-cli/issues/95)) ([a4f1672](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a4f167208035544741fd750010554644d05c5d5a))
- export api-helpers functions ([d723b85](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d723b85cd8745ee3631ad5976eecd0ae66e50e0a))

# [0.0.0-pre.8](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.7...v0.0.0-pre.8) (2020-08-17)

### Bug Fixes

- corrected processing of command line input into command line id ([25da623](https://github.com/SmartThingsCommunity/smartthings-cli/commit/25da6232e71d3485c833859785306e47a939f2c8))

### Features

- add support for building input form command line options ([599c3c2](https://github.com/SmartThingsCommunity/smartthings-cli/commit/599c3c261fd8d84218f477d0118b1a5e2de4a90a))

# [0.0.0-pre.7](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.6...v0.0.0-pre.7) (2020-07-31)

**Note:** Version bump only for package @smartthings/cli

# [0.0.0-pre.6](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.5...v0.0.0-pre.6) (2020-07-28)

**Note:** Version bump only for package @smartthings/cli

# [0.0.0-pre.5](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.4...v0.0.0-pre.5) (2020-07-28)

**Note:** Version bump only for package @smartthings/cli

# [0.0.0-pre.4](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.3...v0.0.0-pre.4) (2020-07-27)

**Note:** Version bump only for package @smartthings/cli

# [0.0.0-pre.3](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.1-pre2...v0.0.0-pre.3) (2020-07-22)

### Bug Fixes

- correct spelling of SchemaCreateResponse ([b0334b3](https://github.com/SmartThingsCommunity/smartthings-cli/commit/b0334b3e0f288c74cffab81d2808c48e9512eb20))
- pass version arg to capabilities delete endpoint ([519c15a](https://github.com/SmartThingsCommunity/smartthings-cli/commit/519c15afc0f79cad61e8d8a633ab4f3d0ee84141))

### Features

- add namespace flag to capabilities create ([8c0ae7e](https://github.com/SmartThingsCommunity/smartthings-cli/commit/8c0ae7e712d837f3c129f65fd11389d3b055c545))
