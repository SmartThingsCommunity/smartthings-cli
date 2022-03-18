import { NoLogLogger } from '@smartthings/core-sdk'

import { LogManager, LoginAuthenticator } from '@smartthings/cli-lib'


/**
 * Performs minimal stubbing required to get CLI commands running under jest.
 */
export function setup(): void {
	jest.spyOn(LogManager.prototype, 'getLogger').mockImplementation(() => new NoLogLogger)

	jest.spyOn(LoginAuthenticator.prototype, 'login').mockImplementation(() => Promise.resolve())
	jest.spyOn(LoginAuthenticator.prototype, 'authenticate').mockImplementation((requestConfig) => Promise.resolve(requestConfig))

	;

	(global as { _credentialsFile?: string })._credentialsFile = 'credentials.json'
}
