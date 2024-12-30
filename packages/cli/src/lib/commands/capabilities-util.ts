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
