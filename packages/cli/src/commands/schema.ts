import { flags } from '@oclif/command'

import { SchemaApp } from '@smartthings/core-sdk'

import { APICommand, outputListing } from '@smartthings/cli-lib'


export default class SchemaCommand extends APICommand {
	static description = 'list all ST Schema Apps currently available in a user account'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
		verbose: flags.boolean({
			description: 'include ARN in output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the schema connector id',
	}]

	tableFieldDefinitions = [
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

	listTableFieldDefinitions = ['appName', 'endpointAppId', 'hostingType']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(SchemaCommand)
		await super.setup(args, argv, flags)

		if (flags.verbose) {
			this.listTableFieldDefinitions.push('ARN/URL')
		}

		await outputListing<SchemaApp, SchemaApp>(this, args.id,
			async () => {
				const items = await this.client.schema.list()
				return items.map(item => {
					return {
						...item,
						'ARN/URL': item.hostingType === 'lambda' ? item.lambdaArn : item.webhookUrl,
					}
				})
			},
			id => this.client.schema.get(id),
		)
	}
}
