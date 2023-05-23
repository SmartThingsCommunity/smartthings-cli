// eslint-disable-next-line @typescript-eslint/no-var-requires
const rootConfig = require('../../jest.config')


module.exports = {
	...rootConfig,
	setupFilesAfterEnv: [
		'jest-extended',
	],
	testPathIgnorePatterns: [
		'./src/__tests__/commands/edge/channels.test.ts',
		'./src/__tests__/commands/edge/channels/delete.test.ts',
		'./src/__tests__/commands/edge/channels/drivers.test.ts',
		'./src/__tests__/commands/edge/channels/enrollments.test.ts',
		'./src/__tests__/commands/edge/channels/metainfo.test.ts',
		'./src/__tests__/commands/edge/drivers.test.ts',
		'./src/__tests__/commands/edge/drivers/default.test.ts',
		'./src/__tests__/commands/edge/drivers/delete.test.ts',
		'./src/__tests__/commands/edge/drivers/install.test.ts',
		'./src/__tests__/commands/edge/drivers/installed.test.ts',
		'./src/__tests__/commands/edge/drivers/logcat.test.ts',
		'./src/__tests__/commands/edge/drivers/package.test.ts',
		'./src/__tests__/commands/edge/drivers/switch.test.ts',
		'./src/__tests__/commands/edge/drivers/uninstall.test.ts',
		'./src/__tests__/lib/commands/channels-util.test.ts',
		'./src/__tests__/lib/commands/drivers-util.test.ts',
		'./src/__tests__/lib/commands/drivers/package-util.test.ts',
		'./src/__tests__/lib/live-logging.test.ts',
	],
}
