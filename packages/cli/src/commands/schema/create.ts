import { Flags } from '@oclif/core'

import { SchemaAppRequest, SchemaCreateResponse } from '@smartthings/core-sdk'

import {
	APICommand,
	inputAndOutputItem,
	lambdaAuthFlags,
	userInputProcessor,
} from '@smartthings/cli-lib'

import { addSchemaPermission } from '../../lib/aws-utils'
import { SCHEMA_AWS_PRINCIPAL, getSchemaAppCreateFromUser } from '../../lib/commands/schema-util'


export default class SchemaAppCreateCommand extends APICommand<typeof SchemaAppCreateCommand.flags> {
	static description = 'create an ST Schema connector' +
		this.apiDocsURL('postApps')

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		authorize: Flags.boolean({
			description: 'authorize connector\'s Lambda functions to be called by SmartThings',
		}),
		...lambdaAuthFlags,
	}

	async run(): Promise<void> {
		const createApp = async (_: void, data: SchemaAppRequest): Promise<SchemaCreateResponse> => {
			if (this.flags.authorize) {
				if (data.hostingType === 'lambda') {
					const principal = this.flags.principal ?? SCHEMA_AWS_PRINCIPAL
					const statementId = this.flags.statement

					if (data.lambdaArn) {
						await addSchemaPermission(data.lambdaArn, principal, statementId)
					}
					if (data.lambdaArnAP) {
						await addSchemaPermission(data.lambdaArnAP, principal, statementId)
					}
					if (data.lambdaArnCN) {
						await addSchemaPermission(data.lambdaArnCN, principal, statementId)
					}
					if (data.lambdaArnEU) {
						await addSchemaPermission(data.lambdaArnEU, principal, statementId)
					}
				} else {
					this.error('Authorization is not applicable to WebHook schema connectors')
				}
			}
			return this.client.schema.create(data)
		}
		await inputAndOutputItem(this,
			{ tableFieldDefinitions: ['endpointAppId', 'stClientId', 'stClientSecret'] },
			createApp, userInputProcessor(() => getSchemaAppCreateFromUser(this, this.flags['dry-run'])),
		)
	}
}
