import {
	AppType,
	type AppUpdateRequest,
} from '@smartthings/core-sdk'

import { awsHelpText } from '../../aws-util.js'
import { httpsURLValidate } from '../../validate-util.js'
import {
	arrayDef,
	type InputDefsByProperty,
	objectDef,
	optionalStringDef,
	staticDef,
	stringDef,
	updateFromUserInput,
} from '../../item-input/index.js'
import { type APICommand } from '../api-command.js'
import { smartAppHelpText } from './apps-util-input-primitives.js'
import { type InputAndOutputItemFlags } from '../input-and-output-item.js'


export const getAppUpdateRequestFromUser = async (
		command: APICommand<InputAndOutputItemFlags>,
		appId: string,
): Promise<AppUpdateRequest> => {
	const {
		singleInstance, lambdaSmartApp, webhookSmartApp, apiOnly, ui, iconImage, appName,
		appType, classifications, displayName, description,
	} = await command.client.apps.get(appId)
	const startingRequest: AppUpdateRequest = {
		appName,
		appType,
		classifications,
		displayName,
		description,
		singleInstance,
		iconImage: iconImage ?? {},
		ui,
	}
	const propertyInputDefs: InputDefsByProperty<AppUpdateRequest> = {
		displayName: stringDef('Display Name'),
		description: stringDef('Description'),
		appName: staticDef(startingRequest.appName),
		appType: staticDef(appType),
		classifications: staticDef(startingRequest.classifications),
		singleInstance: staticDef(startingRequest.singleInstance),
		iconImage: objectDef(
			'Icon Image URL',
			{ url: optionalStringDef('Icon Image URL', { validate: httpsURLValidate }) },
		),
		ui: staticDef(ui),
	}
	if (appType === AppType.LAMBDA_SMART_APP) {
		startingRequest.lambdaSmartApp = lambdaSmartApp
		const helpText = awsHelpText
		propertyInputDefs.lambdaSmartApp = objectDef('Lambda SmartApp',
			{ functions: arrayDef('Lambda Functions', stringDef('Lambda Function', { helpText }), { helpText }) })
	}
	if (appType === AppType.WEBHOOK_SMART_APP) {
		startingRequest.webhookSmartApp = { targetUrl: webhookSmartApp?.targetUrl ?? '' }
		propertyInputDefs.webhookSmartApp = objectDef('Webhook SmartApp', { targetUrl: stringDef('Target URL') })
	}
	if (appType === AppType.API_ONLY) {
		startingRequest.apiOnly = { targetUrl: apiOnly?.subscription?.targetUrl }
		propertyInputDefs.apiOnly = objectDef('API-Only SmartApp', { targetUrl: stringDef('Target URL') })
	}
	const appUpdateDef = objectDef('App Update', propertyInputDefs, { helpText: smartAppHelpText })

	return updateFromUserInput(command, appUpdateDef, startingRequest, { dryRun: !!command.flags.dryRun })
}
