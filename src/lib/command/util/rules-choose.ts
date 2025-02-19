import { type Rule, type SmartThingsClient } from '@smartthings/core-sdk'

import { type WithNamedLocation } from '../../api-helpers.js'
import { getRulesByLocation } from './rules-util.js'
import { type ChooseFunction, createChooseFn } from './util-util.js'


export const chooseRuleFn = (locationId?: string): ChooseFunction<Rule & WithNamedLocation> => createChooseFn(
	{
		itemName: 'rule',
		primaryKeyName: 'id',
		sortKeyName: 'name',
		listTableFieldDefinitions: ['name', 'id', 'locationId', 'location'],
	},
	(client: SmartThingsClient) => getRulesByLocation(client, locationId),
)

export const chooseRule = chooseRuleFn()
