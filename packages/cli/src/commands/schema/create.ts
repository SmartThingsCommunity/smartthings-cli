import { flags } from '@oclif/command'

import { SchemaAppRequest, SchemaCreateResponse } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem, lambdaAuthFlags } from '@smartthings/cli-lib'

import { addSchemaPermission } from '../../lib/aws-utils'
import { SCHEMA_AWS_PRINCIPAL } from './authorize'


export default class SchemaAppCreateCommand extends APICommand {
	static description = 'create an ST Schema connector'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		authorize: flags.boolean({
			description: 'authorize connector\'s Lambda functions to be called by SmartThings',
		}),
		...lambdaAuthFlags,
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(SchemaAppCreateCommand)
		await super.setup(args, argv, flags)

		const createApp = async (_: void, data: SchemaAppRequest): Promise<SchemaCreateResponse> => {
			if (flags.authorize) {
				if (data.hostingType === 'lambda') {
					const principal = flags.principal ?? SCHEMA_AWS_PRINCIPAL
					const statementId = flags['statement-id']

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
					this.logger.error('Authorization is not applicable to WebHook schema connectors')
					// eslint-disable-next-line no-process-exit
					process.exit(1)
				}
			}
			return this.client.schema.create(data)
		}
		await inputAndOutputItem(this,
			{ tableFieldDefinitions: ['endpointAppId', 'stClientId', 'stClientSecret'] },
			createApp)
	}
}
