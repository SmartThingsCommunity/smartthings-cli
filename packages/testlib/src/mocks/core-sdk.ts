import { NoOpAuthenticator, SmartThingsClient, SmartThingsURLProvider } from '@smartthings/core-sdk'


const urlProvider: SmartThingsURLProvider = {
	baseURL: '',
	authURL: '',
	keyApiURL: '',
}

/**
 * This "mock" prevents tests from hitting actual endpoints.
 *
 * In order to successfully run tests with API calls and make assertions on them,
 * the corresponding Endpoint classes can be spied on as needed.
 *
 * @example
 * const getAppsSpy = jest.spyOn(AppsEndpoint.prototype, 'get').mockImplementation()
 */
export class MockSmartThingsClient extends SmartThingsClient {
	constructor() {
		super(new NoOpAuthenticator(), { urlProvider })
	}
}
