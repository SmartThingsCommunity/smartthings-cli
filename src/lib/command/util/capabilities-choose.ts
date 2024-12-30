import inquirer from 'inquirer'

import { type APICommand } from '../api-command.js'
import { type Sorting } from '../io-defs.js'
import { selectFromList, type SelectFromListConfig, type SelectFromListFlags } from '../select.js'
import {
	type CapabilityId,
	convertToId,
	getCustomByNamespace,
	type CapabilitySummaryWithNamespace,
	translateToId,
} from './capabilities-util.js'


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

// This one doesn't use `createChooseFn` because it needs to return a `CapabilityId` instead of
// a string and it seems gross to make `createChooseFn` handle other types when this is the only
// one that uses it.
export const chooseCapability = async (
		command: APICommand<SelectFromListFlags>,
		idOrIndexFromArgs?: string,
		versionFromArgs?: number,
		promptMessage?: string,
		namespace?: string,
		options?: { allowIndex: boolean },
): Promise<CapabilityId> => {
	const sortKeyName = 'id'
	let capabilities: CapabilitySummaryWithNamespace[]
	const listItems = async (): Promise<CapabilitySummaryWithNamespace[]> => {
		if (!capabilities) {
			capabilities = await getCustomByNamespace(command.client, namespace)
		}

		return capabilities
	}
	const preselectedId = options?.allowIndex
		? await translateToId(sortKeyName, idOrIndexFromArgs, listItems)
		: (idOrIndexFromArgs ? { id: idOrIndexFromArgs, version: versionFromArgs ?? 1 } : undefined)
	const config: SelectFromListConfig<CapabilitySummaryWithNamespace> = {
		itemName: 'capability',
		pluralItemName: 'capabilities',
		primaryKeyName: 'id',
		sortKeyName,
		listTableFieldDefinitions: ['id', 'version', 'status'],
	}
	return selectFromList(command, config, {
		preselectedId,
		listItems,
		getIdFromUser,
		promptMessage,
	})
}
