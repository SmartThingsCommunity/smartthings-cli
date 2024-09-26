import { Component } from '@smartthings/core-sdk'

import { stringTranslateToId } from './command-util.js'
import { selectFromList, SelectFromListConfig } from './select.js'
import { SmartThingsCommandInterface } from './smartthings-command.js'


export const chooseComponent = async (command: SmartThingsCommandInterface, componentFromArg?: string, components?: Component[]): Promise<string> => {
	if (!components || components.length === 0) {
		return 'main'
	}

	const config: SelectFromListConfig<Component> = {
		itemName: 'component',
		primaryKeyName: 'id',
		sortKeyName: 'id',
		listTableFieldDefinitions: [{ label: 'Id', value: component => component.id === 'main' ? 'main (default)' : component.id }],
	}
	const listItems = async (): Promise<Component[]> => components
	const preselectedId = await stringTranslateToId(config, componentFromArg, listItems)
	return selectFromList(command, config, { preselectedId, listItems, autoChoose: true })
}
