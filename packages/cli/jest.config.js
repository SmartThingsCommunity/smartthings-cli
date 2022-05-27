// eslint-disable-next-line @typescript-eslint/no-var-requires
const rootConfig = require('../../jest.config')


module.exports = {
	...rootConfig,
	setupFilesAfterEnv: [
		'@smartthings/cli-testlib',
		'jest-extended',
	],
	modulePathIgnorePatterns: [
		'<rootDir>/lib',
	],
}
