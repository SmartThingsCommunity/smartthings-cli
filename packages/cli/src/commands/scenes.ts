import { Flags } from '@oclif/core'

import { SceneSummary, SceneListOptions } from '@smartthings/core-sdk'

import { APICommand, outputListing, selectFromList } from '@smartthings/cli-lib'


export const tableFieldDefinitions = [
	'sceneName', 'sceneId', 'locationId', 'lastExecutedDate',
]

export async function chooseScene(command: APICommand<typeof APICommand.flags>, preselectedId?: string): Promise<string> {
	const config = {
		itemName: 'scene',
		primaryKeyName: 'sceneId',
		sortKeyName: 'sceneName',
	}
	return selectFromList(command, config, {
		preselectedId,
		listItems: () => command.client.scenes.list(),
	})
}

export default class ScenesCommand extends APICommand<typeof ScenesCommand.flags> {
	static description = 'list scenes or get information for a specific scene'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
		'location-id': Flags.string({
			char: 'l',
			description: 'a specific location to query',
			multiple: true,
		}),
	}

	static args = [{
		name: 'idOrIndex',
		description: 'the scene id or number in list',
	}]

	async run(): Promise<void> {
		const config = {
			primaryKeyName: 'sceneId',
			sortKeyName: 'sceneName',
			tableFieldDefinitions,
		}
		const options: SceneListOptions = {
			locationId: this.flags['location-id'],
		}

		await outputListing<SceneSummary, SceneSummary>(this, config, this.args.idOrIndex,
			() => this.client.scenes.list(options),
			id => this.client.scenes.get(id))
	}
}
