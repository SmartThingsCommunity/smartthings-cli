import { OutputAPICommand } from '@smartthings/cli-lib'

import { CapabilityNamespace } from '@smartthings/core-sdk'


export default class CapabilitiesListNamespaces extends OutputAPICommand<CapabilityNamespace[]> {
	static description = 'list all capability namespaces currently available in a user account'

	static flags = OutputAPICommand.flags

	protected tableFieldDefinitions = ['name', 'ownerType', 'ownerId']
	protected buildTableOutput(items: CapabilityNamespace[]): string {
		return this.tableGenerator.buildTableFromList(items, this.tableFieldDefinitions)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesListNamespaces)
		await super.setup(args, argv, flags)

		this.processNormally(() => {
			return this.client.capabilities.listNamespaces()
		})
	}
}
