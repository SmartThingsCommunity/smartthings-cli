import { Capability, CapabilitySummary } from '@smartthings/core-sdk'

import { APICommand, OutputAPICommand } from '@smartthings/cli-lib'


export const capabilityIdInputArgs = [
	{
		name: 'id',
		description: 'the capability id',
		required: true,
	},
	{
		name: 'version',
		description: 'the capability version',
		required: true,
	},
]

export function buildTableOutput(this: APICommand, capability: Capability): string {
	enum SubItemTypes {
		COMMANDS = 'commands',
		ATTRIBUTES = 'attributes'
	}

	const makeTable = (capability: Capability, type: SubItemTypes): string => {
		const headers = type === SubItemTypes.ATTRIBUTES
			? ['Name', 'Type', 'Setter']
			: ['Name', '# of Arguments']
		const table = this.newOutputTable({
			head: headers,
			colWidths: headers.map(() => {
				return 30
			}),
		})
		for (const name in capability[type]) {
			if (type === SubItemTypes.ATTRIBUTES) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const subItem = capability[SubItemTypes.ATTRIBUTES]![name]
				table.push([name, subItem.schema.properties.value.type, subItem.setter || ''])
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const subItem = capability[SubItemTypes.COMMANDS]![name]
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				table.push([name, subItem!.arguments!.length])
			}
		}
		return table.toString()
	}

	let output = `\n\nCapability: ${capability.id}\n`
	if (capability.attributes && Object.keys(capability.attributes).length > 0) {
		output += '\n\nAttributes: \n'
		output += makeTable(capability, SubItemTypes.ATTRIBUTES)
	}
	if (capability.commands && Object.keys(capability.commands).length > 0) {
		output += '\n\nCommands: \n'
		output += makeTable(capability, SubItemTypes.COMMANDS)
	}
	return output
}

export interface CapabilityId {
	id: string
	version: number
}

export type CapabilitySummaryWithNamespace = CapabilitySummary & { namespace: string }

export function buildListTableOutput(this: APICommand, capabilities: CapabilitySummaryWithNamespace[]): string {
	const table = this.newOutputTable({
		head: ['Capability', 'Version', 'Status'],
		colWidths: [80, 10, 10],
	})
	for (const capability of capabilities) {
		table.push([capability.id, capability.version, capability.status || ''])
	}
	return table.toString()
}

/**
 * Get all custom capabilities for all namespaces and include `namespace` as a
 * property in the results. If no namespace is specified, this will make an API
 * call to get all namespaces and list capabilities for all of them.
 */
export async function getCustomByNamespace(this: APICommand, namespace?: string): Promise<CapabilitySummaryWithNamespace[]> {
	let namespaces: string[] = []
	if (namespace) {
		this.log(`namespace specified: ${namespace}`)
		namespaces = [namespace]
	} else {
		namespaces = (await this.client.capabilities.listNamespaces()).map(ns => ns.name)
	}

	if (!namespaces || namespaces.length == 0) {
		throw Error('could not find any namespaces for you account. Perhaps ' +
			"you haven't created any capabilities yet.")
	}

	let capabilities: ({ namespace: string } & CapabilitySummary)[] = []
	for (const namespace of namespaces) {
		const caps = await this.client.capabilities.list(namespace)
		capabilities = capabilities.concat(caps.map(capability => { return { ...capability, namespace } }))
	}
	return capabilities
}

export default class Capabilities extends OutputAPICommand<Capability> {
	static description = 'get a specific capability'

	static flags = OutputAPICommand.flags

	static args = capabilityIdInputArgs

	protected buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(Capabilities)
		await super.setup(args, argv, flags)

		this.processNormally(() => {
			return this.client.capabilities.get(args.id, args.version)
		})
	}
}
