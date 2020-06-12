import { SchemaApp } from '@smartthings/core-sdk'
import { ListingOutputAPICommand } from '@smartthings/cli-lib'
import { flags } from '@oclif/command'


export default class SchemaList extends ListingOutputAPICommand<SchemaApp, SchemaApp> {
	static description = 'list all ST Schema Apps currently available in a user account'

	static flags = {
		...ListingOutputAPICommand.flags,
		verbose: flags.boolean({
			description: 'include ARN in output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the schema connector id',
	}]

	protected tableFieldDefinitions = [
		'appName', 'partnerName', 'endpointAppId', 'schemaType', 'hostingType',
		'stClientId', 'oAuthAuthorizationUrl', 'oAuthTokenUrl', 'oAuthClientId',
		'oAuthClientSecret', 'icon', 'icon2x', 'icon3x',
		{ prop: 'lambdaArn', skipEmpty: true },
		{ prop: 'lambdaArnAP', skipEmpty: true },
		{ prop: 'lambdaArnCN', skipEmpty: true },
		{ prop: 'lambdaArnEU', skipEmpty: true },
		{ prop: 'webhookUrl', skipEmpty: true },
	]

	primaryKeyName = 'endpointAppId'
	sortKeyName = 'appName'

	protected listTableFieldDefinitions = ['appName', 'endpointAppId', 'hostingType']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(SchemaList)
		await super.setup(args, argv, flags)

		if (flags.verbose) {
			this.listTableFieldDefinitions.push('ARN/URL')
		}

		this.processNormally(
			args.id,
			async () => {
				const items: SchemaApp[] = await this.client.schema.list()
				return items.map(item => {
					return {
						appName: item.appName,
						endpointAppId: item.endpointAppId,
						hostingType: item.hostingType,
						'ARN/URL': item.hostingType === 'lambda' ? item.lambdaArn : item.webhookUrl,
					}
				})
			},
			(id) => {
				return this.client.schema.get(id)
			},
		)
	}
}
