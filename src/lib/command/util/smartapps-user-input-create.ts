import { v4 as uuid } from 'uuid'

import { type SmartAppCreateRequest } from '@smartthings/core-sdk'

import { sanitize } from '../../util.js'
import { httpsURLValidate, stringValidateFn } from '../../validate-util.js'
import {
	computedDef,
	createFromUserInput,
	objectDef,
	optionalStringDef,
	staticDef,
	stringDef,
} from '../../item-input/index.js'
import { corsDomainsDef, oauthAppScopeDef, redirectUrisDef, smartAppHelpText } from './smartapps-input-primitives.js'
import type { InputAndOutputItemFlags } from '../input-and-output-item.js'
import { type SmartThingsCommandFlags, type SmartThingsCommand } from '../smartthings-command.js'


const appNameDef = computedDef((context?: unknown[]): string => {
	if (!context || context.length === 0) {
		throw Error('invalid context for appName computed input definition')
	}
	const displayName = (context[0] as Pick<SmartAppCreateRequest, 'displayName'>).displayName

	const retVal = `${sanitize(displayName)}-${uuid()}`.toLowerCase()
	// the app name has to start with a letter or number
	return retVal.match(/^[a-z]/) ? retVal : 'a' + retVal
})

const clientNameDef = computedDef((context?: unknown[]): string => {
	if (!context || context.length !== 2) {
		throw Error('invalid context for clientName computed input definition')
	}
	return (context[1] as Pick<SmartAppCreateRequest, 'displayName'>).displayName
})

const oauthAppCreateRequestInputDefinition = objectDef<SmartAppCreateRequest>(
	'API Access Smart App',
	{
		displayName: stringDef('Display Name', { validate: stringValidateFn({ maxLength: 75 }) }),
		description: stringDef('Description', { validate: stringValidateFn({ maxLength: 250 }) }),
		appName: appNameDef,
		appType: staticDef('API_ONLY'),
		classifications: staticDef(['CONNECTED_SERVICE']),
		singleInstance: staticDef(true),
		iconImage: objectDef(
			'Icon Image',
			{ url: optionalStringDef('Icon Image URL', { validate: httpsURLValidate }) },
		),
		apiOnly: objectDef(
			'API Only',
			{
				targetUrl: optionalStringDef('Target URL', { validate: httpsURLValidate }),
				privacyPolicyUrl: optionalStringDef(
					'Privacy Policy URL (required for business accounts)',
					{ validate: httpsURLValidate },
				),
			},
		),
		principalType: staticDef('LOCATION'),
		oauth: objectDef('OAuth', {
			clientName: clientNameDef,
			scope: oauthAppScopeDef,
			redirectUris: redirectUrisDef,
			corsDomains: corsDomainsDef,
		}, { rollup: true }),
	},
	{ helpText: smartAppHelpText },
)

export const getAppCreateRequestFromUser = async (
		command: SmartThingsCommand<SmartThingsCommandFlags & InputAndOutputItemFlags>,
): Promise<SmartAppCreateRequest> => {
	console.error('You are creating an API Access app.')

	return createFromUserInput(
		command,
		oauthAppCreateRequestInputDefinition,
		{ dryRun: !!command.flags.dryRun },
	)
}
