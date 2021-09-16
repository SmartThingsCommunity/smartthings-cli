import inquirer from 'inquirer'
import { flags } from '@oclif/command'

import { Capability, CapabilityArgument, CapabilitySummary, CapabilityJSONSchema, CapabilityNamespace,
	SmartThingsClient } from '@smartthings/core-sdk'

import { APIOrganizationCommand, ListDataFunction, outputGenericListing, selectGeneric, sort, Sorting, TableGenerator,
	allOrganizationsFlags, forAllOrganizations } from '@smartthings/cli-lib'


export const capabilityIdInputArgs = [
	{
		name: 'id',
		description: 'the capability id',
	},
	{
		name: 'version',
		description: 'the capability version',
	},
]

export const capabilityIdOrIndexInputArgs = [
	{
		name: 'id',
		description: 'the capability id or number in list',
	},
	{
		name: 'version',
		description: 'the capability version',
	},
]

function joinEnums(enums: string[], width: number): string {
	let result = ''
	let lineWidth = 0
	for (const item of enums) {
		if (result) {
			if (lineWidth + item.length + 2 <= width) {
				result += ', '
				lineWidth += item.length + 2
			} else {
				result += '\n'
				lineWidth = 0
			}
		} else {
			lineWidth += item.length + 2
		}
		result += item
	}
	return result
}

export function attributeType(attr: CapabilityJSONSchema, multilineObjects= true): string {
	if (attr.type === 'array') {
		if (Array.isArray(attr.items)) {
			return 'array[' + attr.items.map(it => it.type).join(', ') + ']'
		} else if (attr.items) {
			return `array<${attr.items.type}>`
		}
	} else if (attr.type === 'object') {
		if (attr.properties) {
			const props = attr.properties
			if (multilineObjects) {
				return '{\n' + Object.keys(props).map(it => {
					const item = props[it]
					return `  ${it}: ${item ? item.type : 'undefined'}`
				}).join('\n') + '\n}'
			} else {
				return '{' + Object.keys(props).map(it => {
					const item = props[it]
					return `${it}: ${item ? item.type : 'undefined'}`
				}).join(', ') + '}'
			}
		} else {
			return attr.title || 'object'
		}
	}
	if (attr.enum) {
		return `enum {${joinEnums(attr.enum, 50)}}`
	}
	return attr.type || 'undefined'
}

export function buildTableOutput(tableGenerator: TableGenerator, capability: Capability): string {
	enum SubItemTypes {
		COMMANDS = 'commands',
		ATTRIBUTES = 'attributes'
	}

	const makeTable = (capability: Capability, type: SubItemTypes): string => {
		const headers = type === SubItemTypes.ATTRIBUTES
			? ['Name', 'Type', 'Setter']
			: ['Name', 'Arguments']
		const table = tableGenerator.newOutputTable({ head: headers })
		for (const name in capability[type]) {
			if (type === SubItemTypes.ATTRIBUTES) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const subItem = capability[SubItemTypes.ATTRIBUTES]![name]
				//table.push([name, subItem.schema.properties.value.type, subItem.setter || ''])
				table.push([name, attributeType(subItem.schema.properties.value), subItem.setter || ''])
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const subItem = capability[SubItemTypes.COMMANDS]![name]

				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				table.push([name, subItem!.arguments!.map((it: CapabilityArgument) => it.optional ?
					`${it.name}: ${it.schema?.type} (optional)` :
					`${it.name}: ${attributeType(it.schema)}`)
					.join('\n')])
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

export function buildListTableOutput(this: APIOrganizationCommand, capabilities: CapabilitySummaryWithNamespace[]): string {
	return this.tableGenerator.buildTableFromList(capabilities, ['id', 'version', 'status'])
}

/**
 * Get all custom capabilities for all namespaces and include `namespace` as a
 * property in the results. If no namespace is specified, this will make an API
 * call to get all namespaces and list capabilities for all of them.
 */
export async function getCustomByNamespace(client: SmartThingsClient, namespace?: string): Promise<CapabilitySummaryWithNamespace[]> {
	let namespaces: string[] = []
	if (namespace) {
		namespaces = [namespace]
	} else {
		namespaces = (await client.capabilities.listNamespaces()).map((ns: CapabilityNamespace) => ns.name)
	}

	let capabilities: CapabilitySummaryWithNamespace[] = []
	for (const namespace of namespaces) {
		const caps = await client.capabilities.list(namespace)
		capabilities = capabilities.concat(caps.map((capability: CapabilitySummary) => { return { ...capability, namespace } }))
	}
	return capabilities
}

export async function getStandard(client: SmartThingsClient): Promise<CapabilitySummaryWithNamespace[]> {
	const caps = await client.capabilities.listStandard()
	return caps.map((capability: CapabilitySummary) => { return { ...capability, namespace: 'st' } })
}

export async function getAllFiltered(client: SmartThingsClient, filter: string): Promise<CapabilitySummaryWithNamespace[]> {
	const list = (await Promise.all([getStandard(client), getCustomByNamespace(client)])).flat()
	if (filter) {
		filter = filter.toLowerCase()
		return list.filter(capability => capability.id.toLowerCase().includes(filter) && capability.status !== 'deprecated')
	}
	return list
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getIdFromUser(fieldInfo: Sorting, list: CapabilitySummaryWithNamespace[], promptMessage?: string): Promise<CapabilityId> {
	const convertToId = (itemIdOrIndex: string): string | false => {
		if (itemIdOrIndex.length === 0) {
			return false
		}
		const matchingItem = list.find(item => itemIdOrIndex === item.id)
		if (matchingItem) {
			return itemIdOrIndex
		}

		const index = Number.parseInt(itemIdOrIndex)

		if (!Number.isNaN(index) && index > 0 && index <= list.length) {
			const id = list[index - 1].id
			if (typeof id === 'string') {
				return id
			} else {
				throw Error(`invalid type ${typeof id} for primary key`  +
					` id in ${JSON.stringify(list[index - 1])}`)
			}
		} else {
			return false
		}
	}
	const idOrIndex: string = (await inquirer.prompt({
		type: 'input',
		name: 'idOrIndex',
		message: promptMessage ?? 'Enter id or index',
		validate: input => {
			return convertToId(input)
				? true
				: `Invalid id or index ${input}. Please enter an index or valid id.`
		},
	})).idOrIndex
	const inputId = convertToId(idOrIndex)
	if (inputId === false) {
		throw Error(`unable to convert ${idOrIndex} to id`)
	}

	// TODO: check for version
	// currently the version is always 1. Once it's possible to have
	// other values we should:
	// - check here if there are more than one
	//    - if not, use the one there is
	//    - if so, ask the user which one

	return { 'id': inputId, 'version': 1 }
}

export async function translateToId(sortKeyName: string, idOrIndex: string | CapabilityId,
		listFunction: ListDataFunction<CapabilitySummaryWithNamespace>): Promise<CapabilityId> {
	if (typeof idOrIndex !== 'string') {
		return idOrIndex
	}

	const index = Number.parseInt(idOrIndex)

	if (isNaN(index)) {
		// TODO: when versions are supported, look up and use the most recent
		// version here instead of 1
		return { id: idOrIndex, version: 1 }
	}

	const items = sort(await listFunction(), sortKeyName)
	if (index < 1 || index > items.length) {
		throw Error(`invalid index ${index} (enter an id or index between 1 and ${items.length} inclusive)`)
	}
	const matchingItem: CapabilitySummaryWithNamespace = items[index - 1]
	return { id: matchingItem.id, version: matchingItem.version }
}

export async function chooseCapability(command: APIOrganizationCommand, idFromArgs?: string, versionFromArgs?: number, prompt?: string): Promise<CapabilityId> {
	const preselectedId: CapabilityId | undefined = idFromArgs ? { id: idFromArgs, version: versionFromArgs ?? 1 } : undefined
	const config = {
		itemName: 'capability',
		primaryKeyName: 'id',
		sortKeyName: 'id',
		listTableFieldDefinitions: ['id', 'version', 'status'],
	}
	return selectGeneric(command, config, preselectedId, () => getCustomByNamespace(command.client), getIdFromUser, prompt)
}

export async function chooseCapabilityFiltered(command: APIOrganizationCommand, prompt: string, filter: string): Promise<CapabilityId> {
	const config = {
		itemName: 'capability',
		primaryKeyName: 'id',
		sortKeyName: 'id',
		listTableFieldDefinitions: ['id', 'version', 'status'],
	}
	return selectGeneric(command, config, undefined, () => getAllFiltered(command.client, filter), getIdFromUser, prompt, false)
}

export default class CapabilitiesCommand extends APIOrganizationCommand {
	static description = 'get a specific capability'

	static flags = {
		...APIOrganizationCommand.flags,
		...outputGenericListing.flags,
		...allOrganizationsFlags,
		namespace: flags.string({
			char: 'n',
			description: 'a specific namespace to query; will use all by default',
		}),
		standard: flags.boolean({
			char: 's',
			description: 'show standard SmartThings capabilities',
		}),
	}

	static args = capabilityIdOrIndexInputArgs

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesCommand)
		await super.setup(args, argv, flags)

		const idOrIndex = args.version ? { id: args.id, version: args.version } : args.id
		const config = {
			primaryKeyName: 'id',
			sortKeyName: 'id',
			listTableFieldDefinitions: ['id', 'version', 'status'],
			buildTableOutput: (data: Capability) => buildTableOutput(this.tableGenerator, data),
		}
		await outputGenericListing(this, config, idOrIndex,
			() => {
				if (flags.standard) {
					return getStandard(this.client)
				} else if (flags['all-organizations']) {
					config.listTableFieldDefinitions.push('organization')
					return forAllOrganizations(this.client, (org) => {
						const orgClient = this.client.clone({'X-ST-Organization': org.organizationId})
						return getCustomByNamespace(orgClient, flags.namespace)
					})
				}
				return getCustomByNamespace(this.client, flags.namespace)
			},
			(id: CapabilityId) => this.client.capabilities.get(id.id, id.version),
			(idOrIndex, listFunction) => translateToId(config.sortKeyName, idOrIndex, listFunction))
	}
}
