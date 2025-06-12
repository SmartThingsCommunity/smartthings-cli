import { localhostOrHTTPSValidate } from '../../validate-util.js'
import { arrayDef, CheckboxChoice, checkboxDef, stringDef } from '../../item-input/index.js'


const availableScopes = [
	'r:devices:*',
	'w:devices:*',
	'x:devices:*',
	'r:hubs:*',
	'r:locations:*',
	'w:locations:*',
	'x:locations:*',
	'r:scenes:*',
	'x:scenes:*',
	'r:rules:*',
	'w:rules:*',
	'r:installedapps',
	'w:installedapps',
]

export const oauthAppScopeDef = checkboxDef<string>('Scopes', availableScopes, {
	helpText: 'More information on OAuth 2 Scopes can be found at:\n' +
		'  https://www.oauth.com/oauth2-servers/scope/\n\n' +
		'To determine which scopes you need for the application, see documentation for the' +
		' individual endpoints you will use in your app:\n' +
		'  https://developer.smartthings.com/docs/api/public/',
	validate: (chosen: readonly CheckboxChoice<string>[]) => chosen.length > 0 || 'At least one scope is required.',
})

const redirectUriHelpText = 'More information on redirect URIs can be found at:\n' +
	'  https://www.oauth.com/oauth2-servers/redirect-uris/'
export const redirectUrisDef = arrayDef(
	'Redirect URIs',
	stringDef('Redirect URI', { validate: localhostOrHTTPSValidate, helpText: redirectUriHelpText }),
	{ minItems: 0, maxItems: 10, helpText: redirectUriHelpText },
)

export const smartAppHelpText = 'More information on writing SmartApps can be found at\n' +
	'  https://developer.smartthings.com/docs/connected-services/smartapp-basics'
