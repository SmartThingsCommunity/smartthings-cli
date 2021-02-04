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
}
