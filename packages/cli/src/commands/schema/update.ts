import { flags } from '@oclif/command'

import { SchemaApp, SchemaAppRequest, Status } from '@smartthings/core-sdk'

import { SelectingInputOutputAPICommand } from '@smartthings/cli-lib'

import { addSchemaPermission} from '../../lib/aws-utils'


export default class SchemaUpdateCommand extends SelectingInputOutputAPICommand<SchemaAppRequest, Status, SchemaApp> {
	static description = 'update an ST Schema connector'

	static flags = {
		...SelectingInputOutputAPICommand.flags,
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

		this.processNormally(args.id,
			() => { return this.client.apps.list() },
			async (id, data) => {
				if (flags.authorize) {
					if (data.hostingType === 'lambda') {
						if (data.lambdaArn) {
							await addSchemaPermission(data.lambdaArn)
						}
						if (data.lambdaArnAP) {
							await addSchemaPermission(data.lambdaArnAP)
						}
						if (data.lambdaArnCN) {
							await addSchemaPermission(data.lambdaArnCN)
						}
						if (data.lambdaArnEU) {
							await addSchemaPermission(data.lambdaArnEU)
						}
					} else {
						throw Error('Authorization is not applicable to web-hook schema connectors')
					}
				}
				return this.client.schema.update(args.id, data)
			})
	}
}
