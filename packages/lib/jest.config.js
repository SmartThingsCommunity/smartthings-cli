module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
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
}
