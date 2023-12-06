import type { JestConfigWithTsJest } from 'ts-jest'
import { defaultsESM as tsjPreset } from 'ts-jest/presets'


const config: JestConfigWithTsJest = {
	testMatch: [
		// TODO: put this back when all unit tests are converted
		// '**/__tests__/**/*.test.ts',
		'**/__tests__/lib/*.test.ts',
		'**/__tests__/lib/item-input/*.test.ts',
	],
	setupFilesAfterEnv: ['jest-extended/all'],
	collectCoverageFrom: ['src/**/*.ts'],
	coveragePathIgnorePatterns: [
		'/node_modules/',
		'/__tests__/',
		'/src/run.ts',
		'/src/index.ts',
		'/src/commands/index.ts',
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
		...tsjPreset.transform,
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
		'/node_modules/',
		'./packages',
	],
}

export default config
