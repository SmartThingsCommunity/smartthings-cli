import { type SmartAppListOptions, type PagedSmartApp } from '@smartthings/core-sdk'

import { type ChooseFunction, createChooseFn } from './util-util.js'


export const chooseSmartAppFn = (
		smartAppListOptions?: SmartAppListOptions,
): ChooseFunction<PagedSmartApp> => createChooseFn(
	{
		itemName: 'Smart App',
		primaryKeyName: 'appId',
		sortKeyName: 'displayName',
		listTableFieldDefinitions: ['displayName', 'appType', 'appId'],
	},
	command => command.client.smartapps.list(smartAppListOptions),
)

export const chooseSmartApp = chooseSmartAppFn()
