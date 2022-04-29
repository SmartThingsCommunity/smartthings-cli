import { APICommand, selectFromList } from '@smartthings/cli-lib'


export default class SchemaAppDeleteCommand extends APICommand<typeof SchemaAppDeleteCommand.flags> {
	static description = 'delete the ST Schema connector'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'schema app id',
	}]

	async run(): Promise<void> {
		const config = {
			primaryKeyName: 'endpointAppId',
			sortKeyName: 'appName',
		}
		const id = await selectFromList(this, config, {
			preselectedId: this.args.id,
			listItems: async () => await this.client.schema.list(),
			promptMessage: 'Select a schema app to delete.',
		})
		await this.client.schema.delete(id)
		this.log(`Schema app ${id} deleted.`)
	}
}
