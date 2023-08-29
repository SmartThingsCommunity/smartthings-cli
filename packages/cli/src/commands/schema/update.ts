import { Flags, Errors } from '@oclif/core'

import { SchemaApp, SchemaAppRequest } from '@smartthings/core-sdk'

import { APICommand, inputItem, selectFromList, lambdaAuthFlags, SelectFromListConfig, userInputProcessor } from '@smartthings/cli-lib'

import { addSchemaPermission } from '../../lib/aws-utils'
import { getSchemaAppUpdateFromUser } from '../../lib/commands/schema-util'


export default class SchemaUpdateCommand extends APICommand<typeof SchemaUpdateCommand.flags> {
	static description = 'update an ST Schema connector' +
		this.apiDocsURL('putAppsByEndpointAppId')

	static flags = {
		...APICommand.flags,
		...inputItem.flags,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'dry-run': Flags.boolean({
			char: 'd',
			description: "produce JSON but don't actually submit",
		}),
		authorize: Flags.boolean({
			description: 'authorize Lambda functions to be called by SmartThings',
		}),
		...lambdaAuthFlags,
	}

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	async run(): Promise<void> {
		const config: SelectFromListConfig<SchemaApp> = {
			primaryKeyName: 'endpointAppId',
			sortKeyName: 'appName',
			listTableFieldDefinitions: ['appName', 'endpointAppId', 'hostingType'],
		}
		const id = await selectFromList(this, config, {
			preselectedId: this.args.id,
			listItems: () => this.client.schema.list(),
		})

		const getInputFromUser = async (): Promise<SchemaAppRequest> => {
			const original = await this.client.schema.get(id)
			return getSchemaAppUpdateFromUser(this, original, this.flags['dry-run'])
		}

		const [request] = await inputItem<SchemaAppRequest>(this, userInputProcessor(getInputFromUser))
		if (this.flags.authorize) {
			if (request.hostingType === 'lambda') {
				if (request.lambdaArn) {
					await addSchemaPermission(request.lambdaArn, this.flags.principal, this.flags.statement)
				}
				if (request.lambdaArnAP) {
					await addSchemaPermission(request.lambdaArnAP, this.flags.principal, this.flags.statement)
				}
				if (request.lambdaArnCN) {
					await addSchemaPermission(request.lambdaArnCN, this.flags.principal, this.flags.statement)
				}
				if (request.lambdaArnEU) {
					await addSchemaPermission(request.lambdaArnEU, this.flags.principal, this.flags.statement)
				}
			} else {
				throw Error('Authorization is not applicable to WebHook schema connectors')
			}
		}
		const result = await this.client.schema.update(id, request)
		if (result.status !== 'success') {
			throw new Errors.CLIError(`error ${result.status} updating ${id}`)
		}
		this.log(`Schema ${id} updated.`)
	}
}
