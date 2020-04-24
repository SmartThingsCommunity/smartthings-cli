import Table from 'cli-table'

import { OutputAPICommand } from '@smartthings/cli-lib'

import { CapabilityNamespace } from '@smartthings/core-sdk'


export default class CapabilitiesListNamespaces extends OutputAPICommand<CapabilityNamespace[]> {
	static description = 'list all capabilities currently available in a user account'

	static flags = {
		...OutputAPICommand.flags,
	}

	protected buildTableOutput(namespaces: CapabilityNamespace[]): string {
		const table = new Table({
			head: ['Namespace', 'Owner Type', 'Owner Id'],
			colWidths: [40, 20, 40],
		})
		for (const namespace of namespaces) {
			table.push([namespace.name, namespace.ownerType, namespace.ownerId])
		}
		return table.toString()
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesListNamespaces)
		await super.setup(args, argv, flags)

		this.processNormally(() => {
			return this.client.capabilities.listNamespaces()
		})
	}
}
