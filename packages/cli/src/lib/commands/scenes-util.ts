import { SceneSummary } from '@smartthings/core-sdk'

import { APICommand, selectFromList, SelectFromListConfig } from '@smartthings/cli-lib'


export const tableFieldDefinitions = [
	'sceneName', 'sceneId', 'locationId', 'lastExecutedDate',
]

export async function chooseScene(command: APICommand<typeof APICommand.flags>, preselectedId?: string): Promise<string> {
	const config: SelectFromListConfig<SceneSummary> = {
		itemName: 'scene',
		primaryKeyName: 'sceneId',
		sortKeyName: 'sceneName',
	}
	return selectFromList(command, config, {
		preselectedId,
		listItems: () => command.client.scenes.list(),
	})
}
