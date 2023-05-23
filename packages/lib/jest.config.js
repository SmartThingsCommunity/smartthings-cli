// eslint-disable-next-line @typescript-eslint/no-var-requires
const rootConfig = require('../../jest.config')


module.exports = {
	...rootConfig,
	testPathIgnorePatterns: [
		'./src/__tests__/api-command.test.ts',
		'./src/__tests__/api-organization-command.test.ts',
		'./src/__tests__/basic-io.test.ts',
		'./src/__tests__/command-util.test.ts',
		'./src/__tests__/device-util.test.ts',
		'./src/__tests__/input-builder.test.ts',
		'./src/__tests__/format.test.ts',
		'./src/__tests__/input.test.ts',
		'./src/__tests__/listing-io.test.ts',
		'./src/__tests__/login-authenticator.test.ts',
		'./src/__tests__/output.test.ts',
		'./src/__tests__/output-builder.test.ts',
		'./src/__tests__/select.test.ts',
		'./src/__tests__/smartthings-command.test.ts',
		'./src/__tests__/test-lib/mock-command.ts',
		'./src/__tests__/sse-command.test.ts',
		'./src/__tests__/sse-io.test.ts',

		'./src/__tests__/item-input/command-helpers.test.ts',
	],
}
