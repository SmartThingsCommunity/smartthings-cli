import { type WithLocales } from '../../api-helpers.js'
import { stringInput } from '../../user-query.js'
import { type APICommand } from '../api-command.js'
import { type Sorting } from '../io-defs.js'
import { selectFromList, type SelectFromListConfig, type SelectFromListFlags } from '../select.js'
import {
	type CapabilityId,
	convertToId,
	type CapabilitySummaryWithNamespace,
	getAllFiltered,
	getCustomByNamespace,
	translateToId,
} from './capabilities-util.js'


export const getIdFromUser = async (
		fieldInfo: Sorting<CapabilitySummaryWithNamespace>,
		list: CapabilitySummaryWithNamespace[],
		promptMessage?: string,
): Promise<CapabilityId> => {
	const idOrIndex: string = await stringInput(promptMessage ?? 'Enter id or index', {
		validate: input =>
			convertToId(input, list) ? true : `Invalid id or index ${input}. Please enter an index or valid id.`,
	})
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
		options?: {
			promptMessage?: string
			namespace?: string
			allowIndex?: boolean
			verbose?: boolean
		},
): Promise<CapabilityId> => {
	const sortKeyName = 'id'
	let capabilities: (CapabilitySummaryWithNamespace & WithLocales)[]
	const listItems = async (): Promise<(CapabilitySummaryWithNamespace & WithLocales)[]> => {
		if (!capabilities) {
			capabilities = await getCustomByNamespace(command.client, options?.namespace)
			if (options?.verbose) {
				const ops = capabilities.map(it => command.client.capabilities.listLocales(it.id, it.version))
				const locales = await Promise.all(ops)
				capabilities = capabilities.map((it, index) => {
					return { ...it, locales: locales[index].map(it => it.tag).sort().join(', ') }
				})
			}
		}
		return capabilities
	}
	const preselectedId = options?.allowIndex && idOrIndexFromArgs?.match(/^\d+$/)
		? await translateToId(sortKeyName, idOrIndexFromArgs, listItems)
		: (idOrIndexFromArgs ? { id: idOrIndexFromArgs, version: versionFromArgs ?? 1 } : undefined)
	const config: SelectFromListConfig<CapabilitySummaryWithNamespace & WithLocales> = {
		itemName: 'capability',
		pluralItemName: 'capabilities',
		primaryKeyName: 'id',
		sortKeyName,
		listTableFieldDefinitions: ['id', 'version', 'status'],
	}
	if (options?.verbose) {
		config.listTableFieldDefinitions.splice(3, 0, 'locales')
	}
	return selectFromList<CapabilitySummaryWithNamespace & WithLocales, CapabilityId>(
		command,
		config,
		{
			preselectedId,
			listItems,
			getIdFromUser,
			promptMessage: options?.promptMessage,
		},
	)
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
