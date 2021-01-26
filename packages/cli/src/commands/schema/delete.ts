import { APICommand, selectAndActOn } from '@smartthings/cli-lib'


export default class SchemaAppDeleteCommand extends APICommand {
	static description = 'delete the ST Schema connector'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'schema app id',
	}]

	primaryKeyName = 'endpointAppId'
	sortKeyName = 'appName'

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(SchemaAppDeleteCommand)
		await super.setup(args, argv, flags)

		await selectAndActOn(this, args.id,
			async () => await this.client.schema.list(),
			async id => { await this.client.schema.delete(id) },
			'schema app {{id}} deleted')
	}
}
