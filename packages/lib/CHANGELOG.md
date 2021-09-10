# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.0.0-pre.29](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.28...v0.0.0-pre.29) (2021-09-10)


### Bug Fixes

* **SseCommand:** call base Command init ([91d6a99](https://github.com/SmartThingsCommunity/smartthings-cli/commit/91d6a9916680564f52fe301f7b14c82d706ce420))


### Features

* Added schema:regenerate to create new client IDs and secrets ([8cc9d9a](https://github.com/SmartThingsCommunity/smartthings-cli/commit/8cc9d9a3a8e6f7e7fae61985685e635a9dd8bdef))





# [0.0.0-pre.27](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.26...v0.0.0-pre.27) (2021-08-16)


### Bug Fixes

* narrow type accepted by event logger ([f0882eb](https://github.com/SmartThingsCommunity/smartthings-cli/commit/f0882eb56909d81c2a6558171b1b75bd9ace8c57))





# [0.0.0-pre.26](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.25...v0.0.0-pre.26) (2021-07-22)


### Bug Fixes

* reset authenticationInfo before login, handle error cases better ([ed6ab48](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ed6ab4866fc4453215daa723f23069d296a97b18))


### Features

* add support for device preferences commands ([d4ad86d](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d4ad86d92a1d7b29f7641bc3b1ab3961a510edc8))
* Added device preferences and capability units ([1d9b1c1](https://github.com/SmartThingsCommunity/smartthings-cli/commit/1d9b1c11054243c8e69c8a6dc4d4b817631f0b1b))





# [0.0.0-pre.25](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.24...v0.0.0-pre.25) (2021-05-24)


### Bug Fixes

* fixes to capability translations ([f8b7471](https://github.com/SmartThingsCommunity/smartthings-cli/commit/f8b7471127445ca6c68eaf629449c522080cd423))


### Features

* **LoginAuthenticator:** provide generic auth method ([ae82b6a](https://github.com/SmartThingsCommunity/smartthings-cli/commit/ae82b6a7dc71e10377a20d03ec915a8fe81cdb9c))
* add device preferences output to device profiles ([fa53f10](https://github.com/SmartThingsCommunity/smartthings-cli/commit/fa53f10eec476fc7a07f832e5e95c2f081081d80))
* log errors from source handler ([dc3523b](https://github.com/SmartThingsCommunity/smartthings-cli/commit/dc3523bd8f10181d2f06f456c68797239af94257))





# [0.0.0-pre.24](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.23...v0.0.0-pre.24) (2021-04-29)


### Features

* add logout command which just removes credential for now ([942d886](https://github.com/SmartThingsCommunity/smartthings-cli/commit/942d8863fee0ad5a5f2056f98468788ba5c937c4))





# [0.0.0-pre.22](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.21...v0.0.0-pre.22) (2021-04-21)


### Bug Fixes

* **deps:** include cli-ux as dependency ([c4348be](https://github.com/SmartThingsCommunity/smartthings-cli/commit/c4348be9b99fbc6ec0819d58a0ae4b9c4bd65521))





# [0.0.0-pre.21](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.20...v0.0.0-pre.21) (2021-04-20)


### Features

* accept eventsource init dict ([45eb35f](https://github.com/SmartThingsCommunity/smartthings-cli/commit/45eb35f34a29c0763eebd286d9bde4e43b539ff2))





# [0.0.0-pre.20](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.19...v0.0.0-pre.20) (2021-04-12)


### Features

* **lib:** stream SSE with custom output format ([7f0444d](https://github.com/SmartThingsCommunity/smartthings-cli/commit/7f0444df6abb1dcddb40330a8311f5d5096b99ac))





# [0.0.0-pre.19](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.18...v0.0.0-pre.19) (2021-04-06)


### Features

* output JSON by default when not outputting to the console ([a0d91ff](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a0d91ff73d40131392fb57407c90ce01806b0424))





# [0.0.0-pre.18](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.17...v0.0.0-pre.18) (2021-02-01)

**Note:** Version bump only for package @smartthings/cli-lib





# [0.0.0-pre.17](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.16...v0.0.0-pre.17) (2021-01-25)

**Note:** Version bump only for package @smartthings/cli-lib





# [0.0.0-pre.16](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.15...v0.0.0-pre.16) (2021-01-22)


### Bug Fixes

* correct ordering of InputProcessor calls ([dd4dfd0](https://github.com/SmartThingsCommunity/smartthings-cli/commit/dd4dfd0938f6b6888ce1f0a48840d4b8b0ccdddf))
* fix rules lookup without location id and functional refactor ([bfa67b6](https://github.com/SmartThingsCommunity/smartthings-cli/commit/bfa67b6167c32281825559c65e4f38e38ab1d863))


### Features

* Added support for specifying a language header ([00f50b9](https://github.com/SmartThingsCommunity/smartthings-cli/commit/00f50b9d8aadf0275f4e6426d68207903e639829))





# [0.0.0-pre.15](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.14...v0.0.0-pre.15) (2020-12-21)


### Bug Fixes

* Added support for device presentation manufacturer name ([804eaaa](https://github.com/SmartThingsCommunity/smartthings-cli/commit/804eaaa906d965dd7e66aa98d3e66b166f90fe68))
* remove unnecessary node dependency in lib ([27c38e3](https://github.com/SmartThingsCommunity/smartthings-cli/commit/27c38e3fddb692b7985e77a0d5147f17f929558a))
* use InstalledApp fields in installedapps:rename and refactor to use new functional paradigm ([8170818](https://github.com/SmartThingsCommunity/smartthings-cli/commit/817081833d5d260f48a5fda1255b12ff631ca0da))





# [0.0.0-pre.14](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.13...v0.0.0-pre.14) (2020-12-07)


### Features

* **logger:** default log file path to oclif cacheDir ([a1ce523](https://github.com/SmartThingsCommunity/smartthings-cli/commit/a1ce523eac18c0ddda4c92bc627658bd394a0862))





# [0.0.0-pre.13](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.12...v0.0.0-pre.13) (2020-10-22)

**Note:** Version bump only for package @smartthings/cli-lib





# [0.0.0-pre.11](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.10...v0.0.0-pre.11) (2020-09-28)


### Bug Fixes

* remove ambiguous log method ([5466cd6](https://github.com/SmartThingsCommunity/smartthings-cli/commit/5466cd6ad3ed8bf35ab79d40f7ec2023cbd81f62))
* Update to accommodate switch from vid to presentationId ([3756ed7](https://github.com/SmartThingsCommunity/smartthings-cli/commit/3756ed74abf6feca1d0ba44518ebb85de3930904))


### Features

* add support for access to parsed argv property ([48d1264](https://github.com/SmartThingsCommunity/smartthings-cli/commit/48d12644baaf417e26285a97e4c3ef17562f6c52))
* added device profile and capability localizations ([6a48783](https://github.com/SmartThingsCommunity/smartthings-cli/commit/6a487830539eb3660358c8c448ce1de2e3465f8e))
* use separate file for logging config ([80b3005](https://github.com/SmartThingsCommunity/smartthings-cli/commit/80b30051abb6670ea36f479e18c202fb3bf7b289))





# [0.0.0-pre.10](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.9...v0.0.0-pre.10) (2020-09-02)


### Bug Fixes

* bump core-sdk and log4js versions ([2a3f9ff](https://github.com/SmartThingsCommunity/smartthings-cli/commit/2a3f9fffdabbf5f5babb0cc4aaffe648ddd7ebd8))





# [0.0.0-pre.9](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.8...v0.0.0-pre.9) (2020-09-02)


### Features

* export api-helpers functions ([d723b85](https://github.com/SmartThingsCommunity/smartthings-cli/commit/d723b85cd8745ee3631ad5976eecd0ae66e50e0a))





# [0.0.0-pre.8](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.7...v0.0.0-pre.8) (2020-08-17)


### Bug Fixes

* **LoginAuthenticator:** create cli dir on init ([27d7bee](https://github.com/SmartThingsCommunity/smartthings-cli/commit/27d7bee76a0e8b8043686dd6b066f8fb8bd0d2b9))


### Features

* add support for building input form command line options ([599c3c2](https://github.com/SmartThingsCommunity/smartthings-cli/commit/599c3c261fd8d84218f477d0118b1a5e2de4a90a))





# [0.0.0-pre.7](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.6...v0.0.0-pre.7) (2020-07-31)

**Note:** Version bump only for package @smartthings/cli-lib





# [0.0.0-pre.6](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.5...v0.0.0-pre.6) (2020-07-28)


### Bug Fixes

* make logManager and credentials work across with plugins ([e267b53](https://github.com/SmartThingsCommunity/smartthings-cli/commit/e267b53d3cef7959dd60fb48efd6d25e953beafb))





# [0.0.0-pre.5](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.4...v0.0.0-pre.5) (2020-07-28)


### Bug Fixes

* make cliConfig truly global ([6e2d45f](https://github.com/SmartThingsCommunity/smartthings-cli/commit/6e2d45f5960f8c3340b5e420139bb73674c1dde5))





# [0.0.0-pre.4](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.0-pre.3...v0.0.0-pre.4) (2020-07-27)

**Note:** Version bump only for package @smartthings/cli-lib





# [0.0.0-pre.3](https://github.com/SmartThingsCommunity/smartthings-cli/compare/v0.0.1-pre2...v0.0.0-pre.3) (2020-07-22)

**Note:** Version bump only for package @smartthings/cli-lib
