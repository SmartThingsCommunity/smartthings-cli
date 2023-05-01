import { Flags, Errors } from '@oclif/core'
import inquirer from 'inquirer'
import { v4 as uuid } from 'uuid'

import { AppClassification, AppCreateRequest, AppCreationResponse, AppType, PrincipalType } from '@smartthings/core-sdk'

import {
	APICommand,
	computedDef,
	createFromUserInput,
	httpsURLValidate,
	inputAndOutputItem,
	lambdaAuthFlags,
	objectDef,
	optionalStringDef,
	sanitize,
	staticDef,
	stringDef,
	stringValidateFn,
	userInputProcessor,
} from '@smartthings/cli-lib'

import { addPermission } from '../../lib/aws-utils'
import { oauthAppScopeDef, redirectUrisDef, tableFieldDefinitions } from '../../lib/commands/apps-util'


const appNameDef = computedDef((context?: unknown[]): string => {
	if (!context || context.length === 0) {
		throw Error('invalid context for appName computed input definition')
	}
	const displayName = (context[0] as Pick<AppCreateRequest, 'displayName'>).displayName

	const retVal = `${sanitize(displayName)}-${uuid()}`.toLowerCase()
	// the app name has to start with a letter or number
	return displayName.match(/^[a-z]/) ? retVal : 'a' + retVal
})

const clientNameDef = computedDef((context?: unknown[]): string => {
	if (!context || context.length !== 2) {
		throw Error('invalid context for appName computed input definition')
	}
	return (context[1] as Pick<AppCreateRequest, 'displayName'>).displayName
})

const oauthAppCreateRequestInputDefinition = objectDef<AppCreateRequest>('OAuth-In SmartApp', {
	displayName: stringDef('Display Name', stringValidateFn({ maxLength: 75 })),
	description: stringDef('Description', stringValidateFn({ maxLength: 250 })),
	appName: appNameDef,
	appType: staticDef(AppType.API_ONLY),
	classifications: staticDef([AppClassification.CONNECTED_SERVICE]),
	singleInstance: staticDef(true),
	iconImage: objectDef('Icon Image', {
		url: optionalStringDef('Icon Image URL', httpsURLValidate),
	}),
	apiOnly: objectDef('API Only', { targetUrl: optionalStringDef('Target URL', httpsURLValidate) }),
	principalType: staticDef(PrincipalType.LOCATION),
	oauth: objectDef('OAuth', {
		clientName: clientNameDef,
		scope: oauthAppScopeDef,
		redirectUris: redirectUrisDef,
	}),
})

export default class AppCreateCommand extends APICommand<typeof AppCreateCommand.flags> {
	static description = 'create an app' +
		this.apiDocsURL('createApp')

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		authorize: Flags.boolean({
			description: 'authorize Lambda functions to be called by SmartThings',
		}),
		...lambdaAuthFlags,
	}

	static examples = [
		{ description: 'create an OAuth-In app from prompted input', command: 'smartthings apps:create' },
		{ description: 'create an app defined in "my-app.yaml"', command: 'smartthings apps:create -i my-app.yaml' },
		{
			description: 'create an app defined in "my-app.json" and then authorize it\n' +
				'(See "smartthings apps:authorize" for more information on authorization.)',
			command: 'smartthings apps:create -i my-app.json --authorize',
		},
	]

	async run(): Promise<void> {
		const createApp = async (_: void, data: AppCreateRequest): Promise<AppCreationResponse> => {
			// TODO extract this authorization block out to util function and use in ./update.ts as well
			if (this.flags.authorize) {
				if (data.lambdaSmartApp) {
					if (data.lambdaSmartApp.functions) {
						const requests = data.lambdaSmartApp.functions.map((functionArn) => {
							return addPermission(functionArn, this.flags.principal, this.flags.statement)
						})
						await Promise.all(requests)
					}
				} else {
					throw new Errors.CLIError('Authorization is not applicable to WebHook SmartApps')
				}
			}
			return this.client.apps.create(data)
		}

		const buildTableOutput = (data: AppCreationResponse): string => {
			const basicInfo = this.tableGenerator.buildTableFromItem(data.app, tableFieldDefinitions)

			const oauthInfo = data.oauthClientId || data.oauthClientSecret
				? this.tableGenerator.buildTableFromItem(data, ['oauthClientId', 'oauthClientSecret'])
				: undefined
			return oauthInfo
				? `Basic App Data:\n${basicInfo}\n\nOAuth Info (you will not be able to see the OAuth info again so please save it now!):\n${oauthInfo}`
				: basicInfo
		}

		await inputAndOutputItem(this, { buildTableOutput }, createApp, userInputProcessor(this))
	}

	async getInputFromUser(): Promise<AppCreateRequest> {
		const action = (await inquirer.prompt({
			type: 'list',
			name: 'action',
			message: 'What kind of app do you want to create? (Currently, only OAuth-In apps are supported.)',
			choices: [
				{ name: 'OAuth-Inn App', value: 'oauth-in' },
				{ name: 'Cancel', value: 'cancel' },
			],
			default: 'oauth-in',
		})).action

		if (action === 'oauth-in') {
			return createFromUserInput(this, oauthAppCreateRequestInputDefinition, { dryRun: this.flags['dry-run'] })
		} else {
			this.cancel()
		}
	}
}
