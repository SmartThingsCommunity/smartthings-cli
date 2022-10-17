import inquirer from 'inquirer'

import {
	Capability,
	CapabilityArgument,
	CapabilitySummary,
	CapabilityJSONSchema,
	CapabilityNamespace,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import {
	APICommand,
	ListDataFunction,
	selectFromList,
	SelectFromListConfig,
	sort,
	Sorting,
	TableGenerator,
} from '@smartthings/cli-lib'


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

export const joinEnums = (enums: string[]): string =>
	enums.length === 0 ? '' : ('\n  - ' + enums.join('\n  - '))

export const attributeType = (attr: CapabilityJSONSchema): string => {
	if (attr.type === 'array') {
		if (Array.isArray(attr.items)) {
			return 'array[' + attr.items.map(it => it.type ?? (it.enum ? 'enum' : 'unknown')).join(', ') + ']'
		} else if (attr.items) {
			return `array<${attr.items.type}>`
		}
	} else if (attr.type === 'object') {
		if (attr.properties) {
			const props = attr.properties
			return '{\n' + Object.keys(props).map(it => {
				const item = props[it]
				return `  ${it}: ${item.type ?? 'undefined'}`
			}).join('\n') + '\n}'
		} else {
			return attr.title || 'object'
		}
	}
	if (attr.enum) {
		return `enum${joinEnums(attr.enum)}`
	}
	return attr.type || 'undefined'
}

export const buildTableOutput = (tableGenerator: TableGenerator, capability: Capability): string => {
	enum SubItemTypes {
		COMMANDS = 'commands',
		ATTRIBUTES = 'attributes'
	}

	const makeTable = (capability: Capability, type: SubItemTypes): string => {
		const headers = type === SubItemTypes.ATTRIBUTES
			? ['Name', 'Type', 'Setter']
			: ['Name', 'Arguments']
		const table = tableGenerator.newOutputTable({ head: headers, isList: true })
		for (const name in capability[type]) {
			if (type === SubItemTypes.ATTRIBUTES) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const subItem = capability[SubItemTypes.ATTRIBUTES]![name]
				table.push([name, attributeType(subItem.schema.properties.value), subItem.setter || ''])
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const subItem = capability[SubItemTypes.COMMANDS]![name]

				table.push([name, subItem.arguments?.map((it: CapabilityArgument) => it.optional ?
					`${it.name}: ${attributeType(it.schema)} (optional)` :
					`${it.name}: ${attributeType(it.schema)}`)
					.join('\n') ?? ''])
			}
		}
		return table.toString()
	}

	let output = `Capability: ${capability.name} (${capability.id})\n`
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

/**
 * Get all custom capabilities for all namespaces and include `namespace` as a
 * property in the results. If no namespace is specified, this will make an API
 * call to get all namespaces and list capabilities for all of them.
 */
export const getCustomByNamespace = async (client: SmartThingsClient, namespace?: string): Promise<CapabilitySummaryWithNamespace[]> => {
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

export const getStandard = async (client: SmartThingsClient): Promise<CapabilitySummaryWithNamespace[]> => {
	const caps = await client.capabilities.listStandard()
	return caps.map((capability: CapabilitySummary) => { return { ...capability, namespace: 'st' } })
}

export const getAllFiltered = async (client: SmartThingsClient, filter: string): Promise<CapabilitySummaryWithNamespace[]> => {
	const list = (await Promise.all([getStandard(client), getCustomByNamespace(client)])).flat()
	if (filter) {
		filter = filter.toLowerCase()
		return list.filter(capability => capability.id.toLowerCase().includes(filter) && capability.status !== 'deprecated')
	}
	return list
}

export const convertToId = (itemIdOrIndex: string, list: CapabilitySummaryWithNamespace[]): string | false => {
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
			throw Error(`invalid type ${typeof id} for primary key` +
				` id in ${JSON.stringify(list[index - 1])}`)
		}
	} else {
		return false
	}
}
export const getIdFromUser = async (fieldInfo: Sorting<CapabilitySummaryWithNamespace>, list: CapabilitySummaryWithNamespace[], promptMessage?: string): Promise<CapabilityId> => {
	const idOrIndex: string = (await inquirer.prompt({
		type: 'input',
		name: 'idOrIndex',
		message: promptMessage ?? 'Enter id or index',
		validate: input => {
			return convertToId(input, list)
				? true
				: `Invalid id or index ${input}. Please enter an index or valid id.`
		},
	})).idOrIndex
	const inputId = convertToId(idOrIndex, list)
	if (inputId === false) {
		throw Error(`unable to convert ${idOrIndex} to id`)
	}

	// TODO: check for version
	// currently the version is always 1. Once it's possible to have
	// other values we should:
	// - check here if there are more than one
	//    - if not, use the one there is
	//    - if so, ask the user which one

	return { id: inputId, version: 1 }
}

export const translateToId = async (sortKeyName: Extract<keyof CapabilitySummaryWithNamespace, string>, idOrIndex: string | CapabilityId,
		listFunction: ListDataFunction<CapabilitySummaryWithNamespace>): Promise<CapabilityId> => {
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

export const chooseCapability = async (command: APICommand<typeof APICommand.flags>, idFromArgs?: string,
		versionFromArgs?: number, promptMessage?: string): Promise<CapabilityId> => {
	const preselectedId: CapabilityId | undefined = idFromArgs
		? { id: idFromArgs, version: versionFromArgs ?? 1 }
		: undefined
	const config: SelectFromListConfig<CapabilitySummaryWithNamespace> = {
		itemName: 'capability',
		primaryKeyName: 'id',
		sortKeyName: 'id',
		listTableFieldDefinitions: ['id', 'version', 'status'],
	}
	return selectFromList(command, config, {
		preselectedId,
		listItems: () => getCustomByNamespace(command.client),
		getIdFromUser,
		promptMessage,
	})
}

export const chooseCapabilityFiltered = async (command: APICommand<typeof APICommand.flags>,
		promptMessage: string, filter: string): Promise<CapabilityId> => {
	const config: SelectFromListConfig<CapabilitySummaryWithNamespace> = {
		itemName: 'capability',
		primaryKeyName: 'id',
		sortKeyName: 'id',
		listTableFieldDefinitions: ['id', 'version', 'status'],
	}
	return selectFromList(command, config, {
		listItems: () => getAllFiltered(command.client, filter),
		getIdFromUser,
		promptMessage,
	})
}
