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
		required: false,
	}]

	primaryKeyName = 'endpointAppId'
	sortKeyName = 'appName'

	protected tableHeadings(): string[] {
		if (this.flags.verbose) {
			return ['appName', 'endpointAppId', 'hostingType', 'ARN/URL']
		} else {
			return ['appName', 'endpointAppId', 'hostingType']
		}
	}

	protected buildObjectTableOutput(data: SchemaApp): string {
		const table = this.newOutputTable()
		table.push(['name', data.appName])
		table.push(['partnerName', data.partnerName])
		table.push(['endpointAppId', data.endpointAppId])
		table.push(['schemaType', data.schemaType])
		table.push(['hostingType', data.hostingType])
		// @ts-ignore
		table.push(['stClientId', data.stClientId])
		table.push(['oAuthAuthorizationUrl', data.oAuthAuthorizationUrl])
		table.push(['oAuthTokenUrl', data.oAuthTokenUrl])
		table.push(['oAuthClientId', data.oAuthClientId])
		table.push(['oAuthClientSecret', data.oAuthClientSecret])
		table.push(['icon', data.icon])
		table.push(['icon2x', data.icon2x])
		table.push(['icon3x', data.icon3x])
		if (data.lambdaArn) {
			table.push(['lambdaArn', data.lambdaArn])
		}
		if (data.lambdaArnAP) {
			table.push(['lambdaArnAP', data.lambdaArnAP])
		}
		if (data.lambdaArnCN) {
			table.push(['lambdaArnCN', data.lambdaArnCN])
		}
		if (data.lambdaArnEU) {
			table.push(['lambdaArnEU', data.lambdaArnEU])
		}
		if (data.webhookUrl) {
			table.push(['webhookUrl', data.webhookUrl])
		}
		return table.toString()
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(SchemaList)
		await super.setup(args, argv, flags)

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
