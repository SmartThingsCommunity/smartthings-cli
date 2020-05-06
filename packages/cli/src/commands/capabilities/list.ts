import Table from 'cli-table'

import { CapabilitySummary } from '@smartthings/core-sdk'

import { OutputAPICommand } from '@smartthings/cli-lib'


export function buildTableOutput(capabilities: CapabilitySummary[]): string {
	const table = new Table({
		head: ['Capability', 'Version', 'Status'],
		colWidths: [80, 10, 10],
	})
	for (const capability of capabilities) {
		table.push([capability.id, capability.version, capability.status || ''])
	}
	return table.toString()
}

export default class CapabilitiesList extends OutputAPICommand<({ namespace: string } & CapabilitySummary)[]> {
	static description = 'list all capabilities currently available in a user account'

	static flags = OutputAPICommand.flags

	static args = [
		{
			name: 'namespace',
			description: 'the namespace that custom capabilities are assigned to',
		},
	]

	protected buildTableOutput(capabilities: ({ namespace: string } & CapabilitySummary)[]): string {
		return buildTableOutput(capabilities)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesList)
		await super.setup(args, argv, flags)

		this.processNormally(async () => {
			let namespaces: string[] = []
			if (args.namespace) {
				this.log(`namespace specified: ${args.namespace}`)
				namespaces = [args.namespace]
			} else {
				namespaces = (await this.client.capabilities.listNamespaces()).map(ns => ns.name)
			}

			if (!namespaces || namespaces.length == 0) {
				this.log('could not find any namespaces for you account. Perhaps ' +
					"you haven't created any capabilities yet.")
				this.exit(1)
			}

			let capabilities: ({ namespace: string } & CapabilitySummary)[] = []
			for (const namespace of namespaces) {
				const caps = await this.client.capabilities.list(namespace)
				capabilities = capabilities.concat(caps.map(capability => { return { ...capability, namespace } }))
			}
			return capabilities
		})
	}
}
