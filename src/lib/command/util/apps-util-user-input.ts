import inquirer from 'inquirer'
import { v4 as uuid } from 'uuid'

import {
	AppClassification,
	AppType,
	PrincipalType,
	type AppCreateRequest,
} from '@smartthings/core-sdk'

import { cancelCommand, sanitize } from '../../util.js'
import { httpsURLValidate, stringValidateFn } from '../../validate-util.js'
import {
	computedDef,
	createFromUserInput,
	objectDef,
	optionalStringDef,
	staticDef,
	stringDef,
} from '../../item-input/index.js'
import type { InputAndOutputItemFlags } from '../input-and-output-item.js'
import { type SmartThingsCommandFlags, type SmartThingsCommand } from '../smartthings-command.js'
import { oauthAppScopeDef, redirectUrisDef, smartAppHelpText } from './apps-util-input-primitives.js'


const appNameDef = computedDef((context?: unknown[]): string => {
	if (!context || context.length === 0) {
		throw Error('invalid context for appName computed input definition')
	}
	const displayName = (context[0] as Pick<AppCreateRequest, 'displayName'>).displayName

	const retVal = `${sanitize(displayName)}-${uuid()}`.toLowerCase()
	// the app name has to start with a letter or number
	return retVal.match(/^[a-z]/) ? retVal : 'a' + retVal
})

const clientNameDef = computedDef((context?: unknown[]): string => {
	if (!context || context.length !== 2) {
		throw Error('invalid context for clientName computed input definition')
	}
	return (context[1] as Pick<AppCreateRequest, 'displayName'>).displayName
})

const oauthAppCreateRequestInputDefinition = objectDef<AppCreateRequest>('OAuth-In SmartApp', {
	displayName: stringDef('Display Name', { validate: stringValidateFn({ maxLength: 75 }) }),
	description: stringDef('Description', { validate: stringValidateFn({ maxLength: 250 }) }),
	appName: appNameDef,
	appType: staticDef(AppType.API_ONLY),
	classifications: staticDef([AppClassification.CONNECTED_SERVICE]),
	singleInstance: staticDef(true),
	iconImage: objectDef('Icon Image', {
		url: optionalStringDef('Icon Image URL', { validate: httpsURLValidate }),
	}),
	apiOnly: objectDef(
		'API Only',
		{ targetUrl: optionalStringDef('Target URL', { validate: httpsURLValidate }) },
	),
	principalType: staticDef(PrincipalType.LOCATION),
	oauth: objectDef('OAuth', {
		clientName: clientNameDef,
		scope: oauthAppScopeDef,
		redirectUris: redirectUrisDef,
	}),
}, { helpText: smartAppHelpText })

export const getAppCreateRequestFromUser = async (
		command: SmartThingsCommand<SmartThingsCommandFlags & InputAndOutputItemFlags>,
): Promise<AppCreateRequest> => {
	const action = (await inquirer.prompt({
		type: 'list',
		name: 'action',
		message: 'What kind of app do you want to create? (Currently, only OAuth-In apps are' +
			' supported.)',
		choices: [
			{ name: 'OAuth-In App', value: 'oauth-in' },
			{ name: 'Cancel', value: 'cancel' },
		],
		default: 'oauth-in',
	})).action

	if (action === 'oauth-in') {
		return createFromUserInput(
			command,
			oauthAppCreateRequestInputDefinition,
			{ dryRun: !!command.flags.dryRun },
		)
	}
	return cancelCommand()
}
