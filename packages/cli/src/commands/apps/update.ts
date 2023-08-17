import { Flags } from '@oclif/core'
import { AppUpdateRequest, AppResponse, AppType } from '@smartthings/core-sdk'
import {
	ActionFunction,
	APICommand,
	inputAndOutputItem,
	TableCommonOutputProducer,
	lambdaAuthFlags,
	inputProcessor,
	objectDef,
	stringDef,
	updateFromUserInput,
	staticDef,
	optionalStringDef,
	httpsURLValidate,
	arrayDef,
	InputDefsByProperty,
} from '@smartthings/cli-lib'
import { addPermission, awsHelpText } from '../../lib/aws-utils'
import { chooseApp, smartAppHelpText, tableFieldDefinitions } from '../../lib/commands/apps-util'


export default class AppUpdateCommand extends APICommand<typeof AppUpdateCommand.flags> {
	static description = 'update the settings of the app' +
		'\nSee apps:oauth:update and apps:oauth:generate for updating oauth-related data.\n\n' +
		this.apiDocsURL('updateApp')

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		authorize: Flags.boolean({
			description: 'authorize Lambda functions to be called by SmartThings',
		}),
		...lambdaAuthFlags,
	}

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	static examples = [
		{
			description: 'prompt for an app and edit it interactively',
			command: 'smartthings apps:update',
		},
		{
			description: 'prompt for an app and update it using the data in "my-app.json"',
			command: 'smartthings apps:update -i my-app.json',
		},
		{
			description: 'update the app with the given id using the data in "my-app.json"',
			command: 'smartthings apps:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i my-app.json',
		},
		{
			description: 'update the given app using the data in "my-app.json" and then authorize it\n' +
				'(See "smartthings apps:authorize" for more information on authorization.)',
			command: 'smartthings apps:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i my-app.json --authorize',
		},
	]

	async run(): Promise<void> {
		const appId = await chooseApp(this, this.args.id)

		const getInputFromUser = async (): Promise<AppUpdateRequest> => {
			const {
				singleInstance, lambdaSmartApp, webhookSmartApp, apiOnly, ui, iconImage, appName,
				appType, classifications, displayName, description,
			} = await this.client.apps.get(appId)
			const startingRequest: AppUpdateRequest = {
				appName, appType, classifications, displayName, description, singleInstance, iconImage, ui,
			}
			const propertyInputDefs: InputDefsByProperty<AppUpdateRequest> = {
				displayName: stringDef('Display Name'),
				description: stringDef('Description'),
				appName: staticDef(startingRequest.appName),
				appType: staticDef(appType),
				classifications: staticDef(startingRequest.classifications),
				singleInstance: staticDef(startingRequest.singleInstance),
				iconImage: objectDef('Icon Image URL', { url: optionalStringDef('Icon Image URL', { validate: httpsURLValidate }) }),
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
			const appInputDef = objectDef('App Update', propertyInputDefs, { helpText: smartAppHelpText })

			return updateFromUserInput(this, appInputDef, startingRequest, { dryRun: this.flags['dry-run'] })
		}

		const executeUpdate: ActionFunction<void, AppUpdateRequest, AppResponse> = async (_, data) => {
			if (this.flags.authorize) {
				if (data.lambdaSmartApp) {
					if (data.lambdaSmartApp.functions) {
						const requests = data.lambdaSmartApp.functions.map((it) => {
							return addPermission(it, this.flags.principal, this.flags.statement)
						})
						await Promise.all(requests)
					}
				} else {
					throw new Error('Authorization is not applicable to WebHook SmartApps')
				}
			}
			return this.client.apps.update(appId, data)
		}

		const config: TableCommonOutputProducer<AppResponse> = { tableFieldDefinitions }
		await inputAndOutputItem(this, config, executeUpdate, inputProcessor(() => true, getInputFromUser))
	}
}
