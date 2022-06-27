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
	],
	clearMocks: true,
	reporters: [
		'default',
		'github-actions',
	],
	globals: {
		// TODO: remove when https://github.com/kulshekhar/ts-jest/issues/1967 is resolved
		// related flag in tsconfig as well
		'ts-jest': {
			isolatedModules: true,
		},
	},
}
