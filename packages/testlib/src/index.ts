import { LoginAuthenticator, chooseOptionsDefaults, APICommand } from '@smartthings/cli-lib'
import { MockSmartThingsClient } from './mocks/core-sdk'


/**
 * Partially mock cli-lib. Most useful for I/O functions.
 */
jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		chooseOptionsWithDefaults: jest.fn(() => chooseOptionsDefaults()),
		stringTranslateToId: jest.fn(),
		selectFromList: jest.fn(),
		outputItemOrList: jest.fn(),
		inputAndOutputItem: jest.fn(),
		inputItem: jest.fn(),
		outputItem: jest.fn(),
		resetManagedConfig: jest.fn(),
		formatAndWriteItem: jest.fn(),
		withLocation: jest.fn(),
		withLocations: jest.fn(),
		withLocationAndRoom: jest.fn(),
		withLocationsAndRooms: jest.fn(),
		yamlExists: jest.fn(),
		chooseDevice: jest.fn(),
		chooseComponent: jest.fn(),
		calculateOutputFormat: jest.fn(),
		writeOutput: jest.fn(),
		buildOutputFormatter: jest.fn(),
		resetManagedConfigKey: jest.fn(),
	}
})

/**
 * Stub return value for main API client.
 */
jest.spyOn(APICommand.prototype, 'client', 'get').mockReturnValue(new MockSmartThingsClient())

/**
 * Perform minimal stubbing required to get CLI commands running under jest
 */
jest.spyOn(LoginAuthenticator.prototype, 'login').mockImplementation(() => Promise.resolve())
jest.spyOn(LoginAuthenticator.prototype, 'authenticate').mockImplementation(() => Promise.resolve({}));
(global as { _credentialsFile?: string })._credentialsFile = 'credentials.json'

/**
 * Exports
 */
export * from './mocks/core-sdk'
