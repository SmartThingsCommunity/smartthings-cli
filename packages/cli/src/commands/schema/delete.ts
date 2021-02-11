import { APICommand, selectFromList } from '@smartthings/cli-lib'


export default class SchemaAppDeleteCommand extends APICommand {
	static description = 'delete the ST Schema connector'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'schema app id',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(SchemaAppDeleteCommand)
		await super.setup(args, argv, flags)

		const config = {
			primaryKeyName: 'endpointAppId',
			sortKeyName: 'appName',
		}
		const id = await selectFromList(this, config, args.id,
			async () => await this.client.schema.list(),
			'Select a schema app to delete.')
		await this.client.schema.delete(id)
		this.log(`Schema app ${id} deleted.`)
	}
}
