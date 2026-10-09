import { type SmartAppUpdateRequest } from '@smartthings/core-sdk'

import { httpsURLValidate } from '../../validate-util.js'
import {
	type InputDefsByProperty,
	objectDef,
	optionalStringDef,
	staticDef,
	stringDef,
	updateFromUserInput,
} from '../../item-input/index.js'
import { type APICommand } from '../api-command.js'
import { smartAppHelpText } from './smartapps-input-primitives.js'
import { type InputAndOutputItemFlags } from '../input-and-output-item.js'
import { fatalError } from '../../util.js'


export const getAppUpdateRequestFromUser = async (
		command: APICommand<InputAndOutputItemFlags>,
		appId: string,
): Promise<SmartAppUpdateRequest> => {
	const {
		singleInstance, apiOnly, ui, iconImage,
		appType, classifications, displayName, description,
	} = await command.client.smartapps.get(appId)

	if (appType === 'LAMBDA_SMART_APP' || appType === 'WEBHOOK_SMART_APP') {
		return fatalError('Only API_ONLY apps can be modified.')
	}

	const startingRequest: SmartAppUpdateRequest = {
		appType,
		classifications,
		displayName,
		description,
		singleInstance,
		iconImage: iconImage ?? {},
		apiOnly: {
			targetUrl: apiOnly?.subscription?.targetUrl,
			privacyPolicyUrl: apiOnly?.privacyPolicyUrl,
		},
		ui,
	}
	const propertyInputDefs: InputDefsByProperty<SmartAppUpdateRequest> = {
		displayName: stringDef('Display Name'),
		description: stringDef('Description'),
		appType: staticDef(appType),
		classifications: staticDef(startingRequest.classifications),
		singleInstance: staticDef(startingRequest.singleInstance),
		iconImage: objectDef(
			'Icon Image URL',
			{ url: optionalStringDef('Icon Image URL', { validate: httpsURLValidate }) },
		),
		apiOnly: objectDef(
			'API-Only',
			{
				targetUrl: optionalStringDef('Target URL', { validate: httpsURLValidate }),
				privacyPolicyUrl: optionalStringDef(
					'Privacy Policy URL (required for business accounts)',
					{ validate: httpsURLValidate },
				),
			},
		),
		ui: staticDef(ui),
	}
	const appUpdateDef = objectDef('App Update', propertyInputDefs, { helpText: smartAppHelpText })

	return updateFromUserInput(command, appUpdateDef, startingRequest, { dryRun: !!command.flags.dryRun })
}
