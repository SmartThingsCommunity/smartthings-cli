import { APIOrganizationCommand, outputList } from '@smartthings/cli-lib'


export default class CapabilitiesListNamespacesCommand extends APIOrganizationCommand<typeof CapabilitiesListNamespacesCommand.flags> {
	static description = 'list all capability namespaces currently available in a user account'

	static flags = {
		...APIOrganizationCommand.flags,
		...outputList.flags,
	}

	async run(): Promise<void> {
		const config = {
			sortKeyName: 'name',
			primaryKeyName: 'name',
			listTableFieldDefinitions: ['name', 'ownerType', 'ownerId'],
		}
		await outputList(this, config,
			() => this.client.capabilities.listNamespaces())
	}
}
