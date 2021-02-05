# @smartthings/cli-testlib

A library to support testing the SmartThings CLI and plugins written for it with Jest.

## Usage

### Default Bootstrap

We provide a setup file which stubs out various init hook behavior (config loading, authentication, etc.) in the main CLI. This enables your test suite to start running commands quickly without worrying about these details.

1. Copy (and rename) [jest.setup.ts.example](./jest.setup.ts.example) to a desired location in your project root.
1. Edit your jest config to include [setupFiles](https://jestjs.io/docs/en/configuration#setupfilesafterenv-array) and specify the path to the previously copied setup file. See example jest config below.
```javascript
module.exports = {
	setupFilesAfterEnv: [
		'<rootDir>/jest.setup.ts'
	],
}
```
