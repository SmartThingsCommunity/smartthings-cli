import { flags } from '@oclif/command'
import { CLIError } from '@oclif/errors'

import { SchemaAppRequest } from '@smartthings/core-sdk'

import { APICommand, inputItem, selectFromList, lambdaAuthFlags } from '@smartthings/cli-lib'

import { addSchemaPermission } from '../../lib/aws-utils'


export default class SchemaUpdateCommand extends APICommand {
	static description = 'update an ST Schema connector'

	static flags = {
		...APICommand.flags,
		...inputItem.flags,
		authorize: flags.boolean({
			description: 'authorize Lambda functions to be called by SmartThings',
		}),
		...lambdaAuthFlags,
	}

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(SchemaUpdateCommand)
		await super.setup(args, argv, flags)

		const config = {
			primaryKeyName: 'endpointAppId',
			sortKeyName: 'appName',
			listTableFieldDefinitions: ['appName', 'endpointAppId', 'hostingType'],
		}
		const id = await selectFromList(this, config, args.id, () => this.client.schema.list())

		const [request] = await inputItem<SchemaAppRequest>(this)
		if (flags.authorize) {
			if (request.hostingType === 'lambda') {
				if (request.lambdaArn) {
					await addSchemaPermission(request.lambdaArn, flags.principal, flags['statement-id'])
				}
				if (request.lambdaArnAP) {
					await addSchemaPermission(request.lambdaArnAP, flags.principal, flags['statement-id'])
				}
				if (request.lambdaArnCN) {
					await addSchemaPermission(request.lambdaArnCN, flags.principal, flags['statement-id'])
				}
				if (request.lambdaArnEU) {
					await addSchemaPermission(request.lambdaArnEU, flags.principal, flags['statement-id'])
				}
			} else {
				throw Error('Authorization is not applicable to WebHook schema connectors')
			}
		}
		const result = await this.client.schema.update(id, request)
		if (result.status !== 'success') {
			throw new CLIError(`error ${result.status} updating ${id}`)
		}
		this.log(`Schema ${id} updated.`)
	}
}
