import {APICommand, selectFromList, outputItem} from '@smartthings/cli-lib'


export default class SchemaAppRegenerateCommand extends APICommand {
	static description = 'Regenerate the clientId and clientSecret of the ST Schema connector. The previous values will be invalidated, which may affect existing installations.'

	static flags = {
		...APICommand.flags,
		...outputItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'schema app id',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(SchemaAppRegenerateCommand)
		await super.setup(args, argv, flags)

		const config = {
			primaryKeyName: 'endpointAppId',
			sortKeyName: 'appName',
		}
		const id = await selectFromList(this, config, args.id,
			async () => await this.client.schema.list(),
			'Select a schema app to re-generate its clientId and clientSecret.')

		await outputItem(this, { tableFieldDefinitions: ['endpointAppId', 'stClientId', 'stClientSecret'] }, () =>
			this.client.schema.regenerateOauth(id))
	}
}
