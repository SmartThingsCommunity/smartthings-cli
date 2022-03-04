module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: [
		'**/__tests__/**/*.test.ts',
	],
	setupFilesAfterEnv: [
		'<rootDir>/src/__tests__/setup/jest.setup.ts',
		'jest-extended',
	],
	collectCoverageFrom: ['src/**/*.ts'],
	coveragePathIgnorePatterns: [
		'/node_modules/',
		'/__tests__/',
		'/src/typings/',
		'/src/index.ts',
		'/src/run.ts',
	],
	modulePathIgnorePatterns: [
		'<rootDir>/lib',
	],
}
