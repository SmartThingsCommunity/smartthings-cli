import { Flags, Errors } from '@oclif/core'

import { SchemaApp, SchemaAppRequest } from '@smartthings/core-sdk'

import {
	APIOrganizationCommand,
	inputItem,
	selectFromList,
	lambdaAuthFlags,
	SelectFromListConfig,
	userInputProcessor,
} from '@smartthings/cli-lib'

import { addSchemaPermission } from '../../lib/aws-utils.js'
import {
	getSchemaAppEnsuringOrganization,
	getSchemaAppUpdateFromUser,
	SchemaAppWithOrganization,
} from '../../lib/commands/schema-util.js'


export default class SchemaUpdateCommand extends APIOrganizationCommand<typeof SchemaUpdateCommand.flags> {
	static description = 'update an ST Schema connector' +
		this.apiDocsURL('putAppsByEndpointAppId')

	static flags = {
		...APIOrganizationCommand.flags,
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

		const { schemaApp: original, organizationWasUpdated } =
			await getSchemaAppEnsuringOrganization(this, id, this.flags)
		if (original.certificationStatus === 'wwst' ||
				original.certificationStatus === 'cst' ||
				original.certificationStatus === 'review') {
			const cancelMsgBase =
				'Schema apps that have already been certified cannot be updated via the CLI'
			const cancelMsg = organizationWasUpdated
				? cancelMsgBase + ' so further updates are not possible.'
				: cancelMsgBase + '.'
			this.cancel(cancelMsg)
		}

		const getInputFromUser = async (): Promise<SchemaAppRequest> => {
			return getSchemaAppUpdateFromUser(this, original, this.flags['dry-run'])
		}

		const [request] = await inputItem<SchemaAppWithOrganization>(this, userInputProcessor(getInputFromUser))
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
		const { organizationId, ...data } = request
		const result = await this.client.schema.update(id, data, organizationId)
		if (result.status !== 'success') {
			throw new Errors.CLIError(`error ${result.status} updating ${id}`)
		}
		this.log(`Schema ${id} updated.`)
	}
}
