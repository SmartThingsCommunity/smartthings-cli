import {
	type CapabilitySummary,
	type CapabilityJSONSchema,
	type CapabilityNamespace,
	type SmartThingsClient,
} from '@smartthings/core-sdk'

import { asTextBulletedList, fatalError } from '../../util.js'
import { type ListDataFunction } from '../io-defs.js'
import { sort } from '../output.js'


export const attributeTypeDisplayString = (attr: CapabilityJSONSchema): string => {
	if (attr.type === 'array') {
		if (Array.isArray(attr.items)) {
			return 'array[' +
				attr.items.map(it => it.type ?? (it.enum ? 'enum' : 'unknown')).join(', ') + ']'
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
		return `enum${asTextBulletedList(attr.enum)}`
	}
	return attr.type || 'undefined'
}

export type CapabilityId = {
	id: string
	version: number
}

export type CapabilitySummaryWithNamespace = CapabilitySummary & { namespace: string }

/**
 * Get all custom capabilities for all namespaces and include `namespace` as a
 * property in the results. If no namespace is specified, this will make an API
 * call to get all namespaces and list capabilities for all of them.
 */
export const getCustomByNamespace = async (
		client: SmartThingsClient,
		namespace?: string,
): Promise<CapabilitySummaryWithNamespace[]> => {
	let namespaces: string[] = []
	if (namespace) {
		namespaces = [namespace]
	} else {
		namespaces = (await client.capabilities.listNamespaces())
			.map((ns: CapabilityNamespace) => ns.name)
	}

	let capabilities: CapabilitySummaryWithNamespace[] = []
	for (const namespace of namespaces) {
		const caps = await client.capabilities.list(namespace)
		capabilities = capabilities.concat(caps.map(
			(capability: CapabilitySummary) => ({ ...capability, namespace }),
		))
	}
	return capabilities
}

export const getStandard = async (
		client: SmartThingsClient,
): Promise<CapabilitySummaryWithNamespace[]> => {
	const caps = await client.capabilities.listStandard()
	return caps.map((capability: CapabilitySummary) => ({ ...capability, namespace: 'st' }))
}

export async function translateToId(
	sortKeyName: Extract<keyof CapabilitySummaryWithNamespace, string>,
	idOrIndex: string | CapabilityId,
	listFunction: ListDataFunction<CapabilitySummaryWithNamespace>,
): Promise<CapabilityId>
export async function translateToId(
	sortKeyName: Extract<keyof CapabilitySummaryWithNamespace, string>,
	idOrIndex: string | CapabilityId | undefined,
	listFunction: ListDataFunction<CapabilitySummaryWithNamespace>,
): Promise<CapabilityId | undefined>
export async function translateToId(
		sortKeyName: Extract<keyof CapabilitySummaryWithNamespace, string>,
		idOrIndex: string | CapabilityId | undefined,
		listFunction: ListDataFunction<CapabilitySummaryWithNamespace>,
): Promise<CapabilityId | undefined> {
	if (typeof idOrIndex === 'object') {
		return idOrIndex
	}

	if (idOrIndex === undefined) {
		return undefined
	}

	const index = Number.parseInt(idOrIndex)

	if (isNaN(index)) {
		// TODO: when versions are supported, look up and use the most recent
		// version here instead of 1
		return { id: idOrIndex, version: 1 }
	}

	const items = sort(await listFunction(), sortKeyName)
	if (index < 1 || index > items.length) {
		return fatalError(`invalid index ${index} (enter an id or index between 1 and ${items.length}` +
			'inclusive)')
	}
	const matchingItem: CapabilitySummaryWithNamespace = items[index - 1]
	return { id: matchingItem.id, version: matchingItem.version }
}

export const convertToId = (
		itemIdOrIndex: string,
		list: CapabilitySummaryWithNamespace[],
): string | false => {
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
