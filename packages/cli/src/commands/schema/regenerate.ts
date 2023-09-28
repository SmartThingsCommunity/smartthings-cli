import { APIOrganizationCommand, selectFromList, outputItem, SelectFromListConfig } from '@smartthings/cli-lib'
import { SchemaApp } from '@smartthings/core-sdk'


export default class SchemaAppRegenerateCommand extends APIOrganizationCommand<typeof SchemaAppRegenerateCommand.flags> {
	static description = 'regenerate the clientId and clientSecret of the ST Schema connector\n' +
		'NOTE: The previous values will be invalidated, which may affect existing installations.' +
		this.apiDocsURL('generateStOauthCredentials')

	static flags = {
		...APIOrganizationCommand.flags,
		...outputItem.flags,
	}

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
			promptMessage: 'Select a schema app to regenerate its clientId and clientSecret.',
		})

		await outputItem(this, { tableFieldDefinitions: ['endpointAppId', 'stClientId', 'stClientSecret'] }, () =>
			this.client.schema.regenerateOauth(id))
	}
}
