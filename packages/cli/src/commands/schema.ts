import { Flags } from '@oclif/core'

import { APICommand, outputListing } from '@smartthings/cli-lib'


export default class SchemaCommand extends APICommand<typeof SchemaCommand.flags> {
	static description = 'list all ST Schema Apps currently available in a user account'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
		verbose: Flags.boolean({
			description: 'include ARN in output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the schema connector id',
	}]

	async run(): Promise<void> {
		const config = {
			tableFieldDefinitions: [
				'appName', 'partnerName', 'endpointAppId', 'schemaType', 'hostingType',
				'stClientId', 'oAuthAuthorizationUrl', 'oAuthTokenUrl', 'oAuthClientId',
				'oAuthClientSecret', 'icon', 'icon2x', 'icon3x',
				{ prop: 'lambdaArn', skipEmpty: true },
				{ prop: 'lambdaArnAP', skipEmpty: true },
				{ prop: 'lambdaArnCN', skipEmpty: true },
				{ prop: 'lambdaArnEU', skipEmpty: true },
				{ prop: 'webhookUrl', skipEmpty: true },
				{ prop: 'userEmail', skipEmpty: true },
			],
			primaryKeyName: 'endpointAppId',
			sortKeyName: 'appName',
			listTableFieldDefinitions: ['appName', 'endpointAppId', 'hostingType'],
		}
		if (this.flags.verbose) {
			config.listTableFieldDefinitions.push('ARN/URL')
		}

		await outputListing(this, config, this.args.id,
			async () => {
				const schemaApps = await this.client.schema.list()
				return schemaApps.map(app => {
					return {
						...app,
						'ARN/URL': app.hostingType === 'lambda' ? app.lambdaArn : app.webhookUrl,
					}
				})
			},
			id => this.client.schema.get(id),
		)
	}
}
