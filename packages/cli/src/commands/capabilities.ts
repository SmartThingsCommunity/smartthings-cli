import inquirer from 'inquirer'
import { flags } from '@oclif/command'

import { Capability, CapabilitySummary, CapabilityJSONSchema, CapabilityNamespace} from '@smartthings/core-sdk'

import { APICommand, ListCallback, Listing, ListingOutputAPICommandBase } from '@smartthings/cli-lib'


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

function attributeType(attr: CapabilityJSONSchema): string {
	if (attr.type === 'array') {
		if (Array.isArray(attr.items)) {
			return 'array[' + attr.items.map(it => it.type).join(', ') + ']'
		} else if (attr.items) {
			return `array<${attr.items.type}>`
		}
	} else if (attr.type === 'object') {
		if (attr.properties) {
			return '{\n' + Object.keys(attr.properties).map(it => {
				// @ts-ignore
				const item = attr.properties[it]
				return `  ${it}: ${item ? item.type : 'undefined'}`
			}).join('\n') + '\n}'
		} else {
			return attr.title || 'object'
		}
	}
	if (attr.enum) {
		return `enum<${attr.type}>`
	}
	return attr.type || 'undefined'
}

export function buildTableOutput(this: APICommand, capability: Capability): string {
	enum SubItemTypes {
		COMMANDS = 'commands',
		ATTRIBUTES = 'attributes'
	}

	const makeTable = (capability: Capability, type: SubItemTypes): string => {
		const headers = type === SubItemTypes.ATTRIBUTES
			? ['Name', 'Type', 'Setter']
			: ['Name', 'Arguments']
		const table = this.tableGenerator.newOutputTable({
			head: headers,
			// colWidths: headers.map(() => {
			// 	return 36
			// }),
		})
		for (const name in capability[type]) {
			if (type === SubItemTypes.ATTRIBUTES) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const subItem = capability[SubItemTypes.ATTRIBUTES]![name]
				//table.push([name, subItem.schema.properties.value.type, subItem.setter || ''])
				table.push([name, attributeType(subItem.schema.properties.value), subItem.setter || ''])
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const subItem = capability[SubItemTypes.COMMANDS]![name]

				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				table.push([name, subItem!.arguments!.map((it: CapabilityArgument) => it.optional ?
					`${it.name}: ${it.schema?.type} (optional)` :
					`${it.name}: ${it.schema?.type}`)
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

export function buildListTableOutput(this: APICommand, capabilities: CapabilitySummaryWithNamespace[]): string {
	return this.tableGenerator.buildTableFromList(capabilities, ['id', 'version', 'status'])
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
		namespaces = (await this.client.capabilities.listNamespaces()).map((ns: CapabilityNamespace) => ns.name)
	}

	if (!namespaces || namespaces.length == 0) {
		throw Error('could not find any namespaces for you account. Perhaps ' +
			"you haven't created any capabilities yet.")
	}

	let capabilities: CapabilitySummaryWithNamespace[] = []
	for (const namespace of namespaces) {
		const caps = await this.client.capabilities.list(namespace)
		capabilities = capabilities.concat(caps.map((capability: CapabilitySummary) => { return { ...capability, namespace } }))
	}
	return capabilities
}

export async function getStandard(this: APICommand): Promise<CapabilitySummaryWithNamespace[]> {
	const caps = await this.client.capabilities.listStandard()
	return caps.map((capability: CapabilitySummary) => { return { ...capability, namespace: 'st' } })
}

export async function getIdFromUser(this: APICommand & { primaryKeyName: string },
		items: CapabilitySummaryWithNamespace[]): Promise<CapabilityId> {
	const convertToId = (itemIdOrIndex: string): string | false => {
		if (itemIdOrIndex.length === 0) {
			return false
		}
		const matchingItem = items.find((item) => {
			// @ts-ignore
			return (this.primaryKeyName in item) && itemIdOrIndex === item[this.primaryKeyName]
		})
		if (matchingItem) {
			return itemIdOrIndex
		}

		const index = Number.parseInt(itemIdOrIndex)

		if (!Number.isNaN(index) && index > 0 && index <= items.length) {
			// @ts-ignore
			const id = items[index - 1][this.primaryKeyName]
			if (typeof id === 'string') {
				return id
			} else {
				throw Error(`invalid type ${typeof id} for primary key`  +
					` ${this.primaryKeyName} in ${JSON.stringify(items[index - 1])}`)
			}
		} else {
			return false
		}
	}
	const idOrIndex: string = (await inquirer.prompt({
		type: 'input',
		name: 'idOrIndex',
		message: 'Enter id or index',
		validate: (input) => {
			return convertToId(input)
				? true
				: `Invalid id or index ${idOrIndex}. Please enter an index or valid id.`
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

export async function translateToId(this: Listing<CapabilitySummaryWithNamespace>,  idOrIndex: string | CapabilityId,
		listFunction: ListCallback<CapabilitySummaryWithNamespace>): Promise<CapabilityId> {
	if (typeof idOrIndex !== 'string') {
		return idOrIndex
	}

	const index = Number.parseInt(idOrIndex)

	if (isNaN(index)) {
		// TODO: when versions are supported, look up and use the most recent
		// version here instead of 1
		return { id: idOrIndex, version: 1 }
	}

	const items = this.sort(await listFunction())
	const matchingItem: CapabilitySummaryWithNamespace = items[index - 1]
	return { id: matchingItem.id, version: matchingItem.version }
}

export default class CapabilitiesCommand extends ListingOutputAPICommandBase<CapabilityId, Capability, CapabilitySummaryWithNamespace> {
	static description = 'get a specific capability'

	static flags = {
		...ListingOutputAPICommandBase.flags,
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

	primaryKeyName = 'id'
	sortKeyName = 'id'

	protected tableFieldDefinitions = ['id', 'version', 'status']
	protected listTableFieldDefinitions = this.tableFieldDefinitions

	protected buildTableOutput = buildTableOutput
	protected translateToId = translateToId

	private getCustomByNamespace = getCustomByNamespace
	private getStandard = getStandard

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesCommand)
		await super.setup(args, argv, flags)

		const idOrIndex = args.version
			? { id: args.id, version: args.version }
			: args.id
		this.processNormally(
			idOrIndex,
			() => {
				if (flags.standard) {
					return this.getStandard()
				}
				return this.getCustomByNamespace(flags.namespace)
			},
			(id) =>  this.client.capabilities.get(id.id, id.version))
	}
}
