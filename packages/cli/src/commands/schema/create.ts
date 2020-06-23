import { SchemaAppRequest, SchemaCreateResponse} from '@smartthings/core-sdk'
import { InputOutputAPICommand } from '@smartthings/cli-lib'
import { flags } from '@oclif/command'
import { addSchemaPermission } from '../../lib/aws-utils'


export default class SchemaAppCreateCommand extends InputOutputAPICommand<SchemaAppRequest, SchemaCreateResponse> {
	static description = 'update an ST Schema connector'

	static flags = {
		...InputOutputAPICommand.flags,
		authorize: flags.boolean({
			description: 'authorize connector\'s Lambda functions to be called by SmartThings',
		})}

	protected buildTableOutput(data: SchemaCreateResponse): string {
		const table = this.newOutputTable()
		table.push(['endpointAppId', data.endpointAppId])
		table.push(['stClientId', data.stClientId])
		table.push(['stClientSecret', data.stClientSecret])
		return table.toString()
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(SchemaAppCreateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(async data => {
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
					this.logger.error('Authorization is not applicable to web-hook schema connectors')
					// eslint-disable-next-line no-process-exit
					process.exit(1)
				}
			}
			return this.client.schema.create(data)
		})
	}
}
