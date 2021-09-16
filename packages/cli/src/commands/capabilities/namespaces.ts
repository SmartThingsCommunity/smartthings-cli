import { APIOrganizationCommand, outputList } from '@smartthings/cli-lib'


export default class CapabilitiesListNamespacesCommand extends APIOrganizationCommand {
	static description = 'list all capability namespaces currently available in a user account'

	static flags = {
		...APIOrganizationCommand.flags,
		...outputList.flags,
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesListNamespacesCommand)
		await super.setup(args, argv, flags)

		const config = {
			sortKeyName: 'name',
			primaryKeyName: 'name',
			listTableFieldDefinitions: ['name', 'ownerType', 'ownerId'],
		}
		await outputList(this, config,
			() => this.client.capabilities.listNamespaces())
	}
}
