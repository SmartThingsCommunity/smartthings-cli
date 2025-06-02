import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest'


const presetConfig = createDefaultEsmPreset()

const jestConfig: JestConfigWithTsJest = {
	...presetConfig,
	testMatch: [
		'**/__tests__/**/*.test.ts',
	],
	setupFilesAfterEnv: ['jest-extended/all'],
	collectCoverageFrom: ['src/**/*.ts'],
	coveragePathIgnorePatterns: [
		'/node_modules/',
		'/__tests__/',
		'/src/run.ts',
		'/src/index.ts',
		'/src/commands/index.ts',
		'/src/lib/command/util/st-client-wrapper.ts',
		'/src/lib/colors.ts',
	],
	modulePathIgnorePatterns: [
		'<rootDir>/dist',
	],
	clearMocks: true,
	reporters: [
		'default',
		'github-actions',
		['jest-html-reporters', { darkTheme: true }],
	],
	extensionsToTreatAsEsm: ['.ts'],
	// moduleNameMapper and transform are for ES module support.
	// See https://kulshekhar.github.io/ts-jest/docs/guides/esm-support
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
			},
		],
	},
	testPathIgnorePatterns: [
		'/node_modules/',
		'./packages',
	],
}

export default jestConfig
