module.exports = {
	preset: 'ts-jest',
	testMatch: [
		'**/__tests__/**/*.test.ts',
	],
	setupFilesAfterEnv: ['jest-extended'],
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
	globals: {
		// TODO: remove when https://github.com/kulshekhar/ts-jest/issues/1967 is resolved
		// related flag in tsconfig as well
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'ts-jest': {
			isolatedModules: true,
		},
	},
}
