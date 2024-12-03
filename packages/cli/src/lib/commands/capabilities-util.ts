import inquirer from 'inquirer'

import {
	type Capability,
	type CapabilityArgument,
	type CapabilitySummary,
	type CapabilityJSONSchema,
	type CapabilityNamespace,
	type SmartThingsClient,
} from '@smartthings/core-sdk'

import { type TableGenerator } from '../../table-generator.js'
import { type APICommand } from '../api-command.js'
import { type ListDataFunction, type Sorting } from '../io-defs.js'
import { sort } from '../output.js'
import { selectFromList, type SelectFromListConfig, type SelectFromListFlags } from '../select.js'


export const getAllFiltered = async (
		client: SmartThingsClient,
		filter: string,
): Promise<CapabilitySummaryWithNamespace[]> => {
	const list = (await Promise.all([getStandard(client), getCustomByNamespace(client)])).flat()
	if (filter) {
		filter = filter.toLowerCase()
		return list.filter(capability =>
			capability.id.toLowerCase().includes(filter) && capability.status !== 'deprecated')
	}
	return list
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
export const getIdFromUser = async (
		fieldInfo: Sorting<CapabilitySummaryWithNamespace>,
		list: CapabilitySummaryWithNamespace[],
		promptMessage?: string,
): Promise<CapabilityId> => {
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

export const chooseCapability = async (
		command: APICommand<SelectFromListFlags>,
		idFromArgs?: string,
		versionFromArgs?: number,
		promptMessage?: string,
		namespace?: string,
): Promise<CapabilityId> => {
	const preselectedId: CapabilityId | undefined = idFromArgs
		? { id: idFromArgs, version: versionFromArgs ?? 1 }
		: undefined
	const config: SelectFromListConfig<CapabilitySummaryWithNamespace> = {
		itemName: 'capability',
		pluralItemName: 'capabilities',
		primaryKeyName: 'id',
		sortKeyName: 'id',
		listTableFieldDefinitions: ['id', 'version', 'status'],
	}
	return selectFromList(command, config, {
		preselectedId,
		listItems: () => getCustomByNamespace(command.client, namespace),
		getIdFromUser,
		promptMessage,
	})
}

export const chooseCapabilityFiltered = async (
		command: APICommand<SelectFromListFlags>,
		promptMessage: string,
		filter: string,
): Promise<CapabilityId> => {
	const config: SelectFromListConfig<CapabilitySummaryWithNamespace> = {
		itemName: 'capability',
		pluralItemName: 'capabilities',
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
