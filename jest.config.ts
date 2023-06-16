import { Config } from 'jest'


const config: Config = {
	preset: 'ts-jest',
	testMatch: [
		'**/__tests__/**/*.test.ts',
	],
	setupFilesAfterEnv: ['jest-extended/all'],
	collectCoverageFrom: ['src/**/*.ts'],
	coveragePathIgnorePatterns: [
		'/node_modules/',
		'/__tests__/',
		'/src/index.ts',
	],
	modulePathIgnorePatterns: [
		'<rootDir>/dist',
	],
	clearMocks: true,
	reporters: [
		'default',
		'github-actions',
		'jest-html-reporters',
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
				// TODO: remove when https://github.com/kulshekhar/ts-jest/issues/1967 is resolved
				// related flag in tsconfig as well
				isolatedModules: true,
			},
		],
	},
	testPathIgnorePatterns: [
		'./packages',
	],
}

export default config
