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

module.exports = config
