import { localhostOrHTTPSValidate } from '../../validate-util.js'
import { arrayDef, CheckboxChoice, checkboxDef, stringDef } from '../../item-input/index.js'


type ScopeInfo = { scope: string; description: string }

const availableScopes: ScopeInfo[] = [
	{
		scope: 'r:devices:*',
		description: 'Read a specific device or all devices.',
	},
	{
		scope: 'w:devices:*',
		description: 'Write to a specific device or all devices.',
	},
	{
		scope: 'x:devices:*',
		description: 'Execute commands on a specific device or all devices.',
	},
	{
		scope: 'r:hubs:*',
		description: 'Read a specific hub or all hubs.',
	},
	{
		scope: 'r:locations:*',
		description: 'Read all locations. An installed app can only read the location it is installed in.',
	},
	{
		scope: 'w:locations:*',
		description: 'Write all locations.',
	},
	{
		scope: 'x:locations:*',
		description: 'Change the mode of a location.',
	},
	{
		scope: 'r:scenes:*',
		description: 'Read a specific scene or all scenes.',
	},
	{
		scope: 'x:scenes:*',
		description: 'Execute a specific scene or all scenes.',
	},
	{
		scope: 'r:rules:*',
		description: 'Read one or all rules.',
	},
	{
		scope: 'w:rules:*',
		description: 'Write one or all rules.',
	},
	{
		scope: 'sse',
		description: 'Read and Write permissions required to use the SSE Subscription API.',
	},
]

const scopeItems = availableScopes.map(({ scope, description }) => ({ name: `${scope} - ${description}`, value: scope }))

export const oauthAppScopeDef = checkboxDef<string>('Scopes', scopeItems, {
	helpText: 'More information on OAuth 2 Scopes can be found at:\n' +
		'  https://www.oauth.com/oauth2-servers/scope/\n\n' +
		'To determine which scopes you need for the application, see documentation for the' +
		' individual endpoints you will use in your app:\n' +
		'  https://developer.smartthings.com/docs/api/public/',
	validate: (chosen: readonly CheckboxChoice<string>[]) => chosen.length > 0 || 'At least one scope is required.',
})

const redirectUrisHelpText = 'More information on redirect URIs can be found at:\n' +
	'  https://www.oauth.com/oauth2-servers/redirect-uris/'
export const redirectUrisDef = arrayDef(
	'Redirect URIs',
	stringDef('Redirect URI', { validate: localhostOrHTTPSValidate, helpText: redirectUrisHelpText }),
	{ minItems: 0, maxItems: 10, helpText: redirectUrisHelpText },
)

const corsDomainsHelpText = 'More information on CORS domains can be found at:\n' +
	'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS'
export const corsDomainsDef = arrayDef(
	'CORS Domains',
	stringDef('CORS Domain', { validate: localhostOrHTTPSValidate, helpText: corsDomainsHelpText }),
	{ minItems: 0, maxItems: 10, helpText: corsDomainsHelpText },
)

export const smartAppHelpText = 'More information on writing API Access Smart Apps can be found at\n' +
	'  https://developer.smartthings.com/docs/service-integrations/get-started'
