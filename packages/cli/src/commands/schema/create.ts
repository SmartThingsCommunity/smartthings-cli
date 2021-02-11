import { flags } from '@oclif/command'

import { SchemaAppRequest, SchemaCreateResponse } from '@smartthings/core-sdk'

import { InputOutputAPICommand } from '@smartthings/cli-lib'

import { addSchemaPermission } from '../../lib/aws-utils'
import { lambdaAuthFlags } from '../../lib/common-flags'


export default class SchemaAppCreateCommand extends InputOutputAPICommand<SchemaAppRequest, SchemaCreateResponse> {
	static description = 'create an ST Schema connector'

	static flags = {
		...InputOutputAPICommand.flags,
		authorize: flags.boolean({
			description: 'authorize connector\'s Lambda functions to be called by SmartThings',
		}),
		...lambdaAuthFlags,
	}

	protected tableFieldDefinitions = ['endpointAppId', 'stClientId', 'stClientSecret']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(SchemaAppCreateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(async data => {
			if (flags.authorize) {
				if (data.hostingType === 'lambda') {
					if (data.lambdaArn) {
						await addSchemaPermission(data.lambdaArn, flags.principal, flags['statement-id'])
					}
					if (data.lambdaArnAP) {
						await addSchemaPermission(data.lambdaArnAP, flags.principal, flags['statement-id'])
					}
					if (data.lambdaArnCN) {
						await addSchemaPermission(data.lambdaArnCN, flags.principal, flags['statement-id'])
					}
					if (data.lambdaArnEU) {
						await addSchemaPermission(data.lambdaArnEU, flags.principal, flags['statement-id'])
					}
				} else {
					this.logger.error('Authorization is not applicable to web-hook schema connectors.')
					// eslint-disable-next-line no-process-exit
					process.exit(1)
				}
			}
			return this.client.schema.create(data)
		})
	}
}
