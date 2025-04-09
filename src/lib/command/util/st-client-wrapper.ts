import {
	type Authenticator,
	BearerTokenAuthenticator,
	EndpointClient,
	type EndpointClientConfig,
	type RESTClientConfig,
	SmartThingsClient,
} from '@smartthings/core-sdk'


/**
 * A simple wrapper around `SmartThingsClient` so we can unit test more easily. In the future,
 * we can look into better ways to solve this. (Perhaps updating the core SDK itself.)
 */
export const newSmartThingsClient = (authenticator: Authenticator, config?: RESTClientConfig): SmartThingsClient =>
	new SmartThingsClient(authenticator, config)

export const newBearerTokenAuthenticator = (token: string): BearerTokenAuthenticator =>
	new BearerTokenAuthenticator(token)

export const newEndpointClient = (basePath: string, config: EndpointClientConfig): EndpointClient =>
	new EndpointClient(basePath, config)
