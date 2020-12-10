import { APICommand, outputList } from '@smartthings/cli-lib'

import { CapabilityNamespace } from '@smartthings/core-sdk'


export default class CapabilitiesListNamespaces extends APICommand {
	static description = 'list all capability namespaces currently available in a user account'

	static flags = {
		...APICommand.flags,
		...outputList.flags,
	}

	listTableFieldDefinitions = ['name', 'ownerType', 'ownerId']
	sortKeyName = 'name'
	primaryKeyName = 'name'

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesListNamespaces)
		await super.setup(args, argv, flags)

		await outputList<CapabilityNamespace>(this,
			() => this.client.capabilities.listNamespaces())
	}
}
