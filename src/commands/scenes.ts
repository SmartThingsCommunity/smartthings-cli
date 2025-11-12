import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type SceneSummary, type SceneListOptions } from '@smartthings/core-sdk'

import { buildEpilog } from '../lib/help.js'
import {
	apiCommand,
	apiCommandBuilder,
	type APICommandFlags,
} from '../lib/command/api-command.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../lib/command/listing-io.js'
import { tableFieldDefinitions } from '../lib/command/util/scenes-util.js'


export type CommandArgs = APICommandFlags & OutputItemOrListFlags & {
	location?: string[]
	idOrIndex?: string
}

const command = 'scenes [id-or-index]'

const describe = 'list scenes or get information for a specific scene'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiCommandBuilder(yargs))
		.positional(
			'id-or-index',
			{ describe: 'the scene id or number from list', type: 'string' },
		)
		.option(
			'location',
			{ alias: 'l', describe: 'filter results by location', type: 'string', array: true },
		)
		.example([
			['$0 scenes', 'list all scenes'],
			[
				'$0 scenes 1',
				'display details for the first scene in the list retrieved by running' +
					' "smartthings scenes"',
			],
			[
				'$0 scenes f45c2df1-9dce-4e63-85ba-c7f7fdfe9677',
				'display details for a scene by id',
			],
			[
				'$0 scenes --location 2916ca34-a8c1-4bad-96b8-2d950b6619a0',
				'list all scenes at the specified location',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: ['listScenes'] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const config: OutputItemOrListConfig<SceneSummary> = {
		primaryKeyName: 'sceneId',
		sortKeyName: 'sceneName',
		tableFieldDefinitions,
	}
	const options: SceneListOptions = {
		locationId: argv.location,
	}

	await outputItemOrList<SceneSummary, SceneSummary>(command, config, argv.idOrIndex,
		() => command.client.scenes.list(options),
		id => command.client.scenes.get(id))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
