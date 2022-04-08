# @smartthings/cli-testlib

A library to support testing the SmartThings CLI and plugins written for it with Jest. It provides a setup file which stubs out various behavior (config loading, authentication, etc.) in the main CLI. This enables your test suite to start running commands quickly without worrying about these details.

## Installation

`npm i @smartthings/cli-testlib --save-dev`

## Usage

Edit your jest config to include [setupFilesAfterEnv](https://jestjs.io/docs/en/configuration#setupfilesafterenv-array) and specify it as shown.

```javascript
module.exports = {
  setupFilesAfterEnv: ['@smartthings/cli-testlib'],
}
```

You can also extend/override the default setup script with one of your own as needed. (TODO: this may be required in some cases)

```javascript
module.exports = {
	setupFilesAfterEnv: [
		'@smartthings/cli-testlib',
		'<rootDir>/jest.setup.ts'
	],
}
```
