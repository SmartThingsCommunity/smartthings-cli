import { type SceneSummary } from '@smartthings/core-sdk'

import { type TableFieldDefinition } from '../../table-generator.js'
import { type ChooseFunction, createChooseFn } from './util-util.js'


export const tableFieldDefinitions: TableFieldDefinition<SceneSummary>[] = [
	'sceneName', 'sceneId', 'locationId', 'lastExecutedDate',
]

export const chooseSceneFn = (): ChooseFunction<SceneSummary> => createChooseFn(
	{
		itemName: 'scene',
		primaryKeyName: 'sceneId',
		sortKeyName: 'sceneName',
	},
	command => command.client.scenes.list(),
)

export const chooseScene = chooseSceneFn()
