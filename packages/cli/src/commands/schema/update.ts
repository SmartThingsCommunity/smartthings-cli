import { SchemaAppRequest, Status} from '@smartthings/core-sdk'
import { flags } from '@oclif/command'
import { InputOutputAPICommand } from '@smartthings/cli-lib'
import { addSchemaPermission} from '../../lib/aws-utils'


export default class SchemaUpdateCommand extends InputOutputAPICommand<SchemaAppRequest, Status> {
	static description = 'update an ST Schema connector'

	static flags = {
		...InputOutputAPICommand.flags,
		authorize: flags.boolean({
			description: 'authorize Lambda functions to be called by SmartThings',
		})}

	static args = [{
		name: 'id',
		description: 'the app id',
		required: true,
	}]

	primaryKeyName = 'endpointAppId'
	sortKeyName = 'appName'

	protected buildTableOutput(status: Status): string {
		return `status: ${status.status}`
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(SchemaUpdateCommand)
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
			return this.client.schema.update(args.id, data)
		})
	}
}
