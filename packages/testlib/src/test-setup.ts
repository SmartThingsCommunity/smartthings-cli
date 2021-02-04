import { cliConfig, LogManager, LoginAuthenticator } from '@smartthings/cli-lib'
import { NoLogLogger } from '@smartthings/core-sdk'


export function setup(): void {
	const configProfileData = {
		clientIdProvider: {
			baseURL: 'https://localhost',
			authURL: 'https://localhost/oauth/token',
			baseOAuthInURL: 'https://localhost/oauth',
		},
	}

	jest.spyOn(cliConfig, 'getProfile').mockImplementation(() => configProfileData)
	jest.spyOn(LogManager.prototype, 'getLogger').mockImplementation(() => new NoLogLogger)
	jest.spyOn(LoginAuthenticator.prototype, 'login').mockImplementation(() => Promise.resolve())
	jest.spyOn(LoginAuthenticator.prototype, 'authenticate').mockImplementation((requestConfig) => Promise.resolve(requestConfig));

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(global as any)._credentialsFile = 'credentials.json'
}
