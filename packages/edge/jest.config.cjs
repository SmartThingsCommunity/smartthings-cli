const config = {
	preset: 'ts-jest',
	testMatch: [
		'**/__tests__/**/*.test.ts',
	],
	setupFilesAfterEnv: ['jest-extended/all'],
	collectCoverageFrom: ['src/**/*.ts'],
	coveragePathIgnorePatterns: [
		'/node_modules/',
		'/__tests__/',
		'/src/typings/',
		'/src/index.ts',
	],
	modulePathIgnorePatterns: [
		'<rootDir>/dist',
		'<rootDir>/lib',
	],
	clearMocks: true,
	reporters: [
		'default',
		'github-actions',
		'jest-html-reporters',
	],
	extensionsToTreatAsEsm: ['.ts'],
	moduleNameMapper: {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	transform: {
		// '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
		// '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'^.+\\.tsx?$': [
			'ts-jest',
			{
				useESM: true,
				// TODO: remove when https://github.com/kulshekhar/ts-jest/issues/1967 is resolved
				// related flag in tsconfig as well
				isolatedModules: true,
			},
		],
	},
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

module.exports = config
