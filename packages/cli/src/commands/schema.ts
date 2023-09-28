import { Flags } from '@oclif/core'

import { SchemaApp } from '@smartthings/core-sdk'

import {
	allOrganizationsFlags,
	APIOrganizationCommand,
	outputItemOrList,
	OutputItemOrListConfig,
} from '@smartthings/cli-lib'


export default class SchemaCommand extends APIOrganizationCommand<typeof SchemaCommand.flags> {
	static description = 'list all ST Schema Apps currently available in a user account' +
		this.apiDocsURL('getAppsByUserToken', 'getAppsByEndpointAppId')

	static flags = {
		...APIOrganizationCommand.flags,
		...outputItemOrList.flags,
		...allOrganizationsFlags,
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
		const config: OutputItemOrListConfig<SchemaApp> = {
			tableFieldDefinitions: [
				'appName', 'partnerName', 'endpointAppId', 'organizationId', 'schemaType', 'hostingType',
				// stClientId is missing from the docs
				('stClientId' as keyof SchemaApp), 'oAuthAuthorizationUrl', 'oAuthTokenUrl', 'oAuthClientId',
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
			listTableFieldDefinitions: ['appName', 'endpointAppId', 'organizationId', 'hostingType'],
		}
		if (this.flags.verbose) {
			config.listTableFieldDefinitions.push({
				label: 'ARN/URL',
				value: app => app.hostingType === 'lambda' ? app.lambdaArn : app.webhookUrl,
			})
		}

		await outputItemOrList(this, config, this.args.id,
			() => this.client.schema.list(),
			id => this.client.schema.get(id),
		)
	}
}
