import { Flags } from '@oclif/core'

import { SceneSummary, SceneListOptions } from '@smartthings/core-sdk'

import { APICommand, outputListing } from '@smartthings/cli-lib'
import { tableFieldDefinitions } from '../lib/commands/scenes-util'


export default class ScenesCommand extends APICommand<typeof ScenesCommand.flags> {
	static description = 'list scenes or get information for a specific scene'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
		// eslint-disable-next-line @typescript-eslint/naming-convention
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
