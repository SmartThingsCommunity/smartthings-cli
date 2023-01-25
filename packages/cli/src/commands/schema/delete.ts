import { SchemaApp } from '@smartthings/core-sdk'

import { APICommand, selectFromList, SelectFromListConfig } from '@smartthings/cli-lib'


export default class SchemaAppDeleteCommand extends APICommand<typeof SchemaAppDeleteCommand.flags> {
	static description = 'delete the ST Schema connector' +
		this.apiDocsURL('deleteAppsByEndpointAppId')

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'schema app id',
	}]

	async run(): Promise<void> {
		const config: SelectFromListConfig<SchemaApp> = {
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
