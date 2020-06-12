import { flags } from '@oclif/command'

import { SchemaAppRequest } from '@smartthings/core-sdk'

import { InputAPICommand } from '@smartthings/cli-lib'

import { addSchemaPermission} from '../../lib/aws-utils'


export default class SchemaUpdateCommand extends InputAPICommand<SchemaAppRequest> {
	static description = 'update an ST Schema connector'

	static flags = {
		...InputAPICommand.flags,
		authorize: flags.boolean({
			description: 'authorize Lambda functions to be called by SmartThings',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the app id',
		required: true,
	}]

	primaryKeyName = 'endpointAppId'
	sortKeyName = 'appName'

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(SchemaUpdateCommand)
		await super.setup(args, argv, flags)

		this.processNormally('successfully updated', async data => {
			if (flags.authorize) {
				if (data.hostingType === 'lambda') {
					if (data.lambdaArn) {
						addSchemaPermission(data.lambdaArn)
					}
					if (data.lambdaArnAP) {
						addSchemaPermission(data.lambdaArnAP)
					}
					if (data.lambdaArnCN) {
						addSchemaPermission(data.lambdaArnCN)
					}
					if (data.lambdaArnEU) {
						addSchemaPermission(data.lambdaArnEU)
					}
				} else {
					throw Error('Authorization is not applicable to web-hook schema connectors')
				}
			}
			await this.client.schema.update(args.id, data)
		})
	}
}
