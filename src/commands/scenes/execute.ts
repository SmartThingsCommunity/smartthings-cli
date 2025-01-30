import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { SuccessStatusValue } from '@smartthings/core-sdk'

import { apiCommand, apiCommandBuilder, APICommandFlags, apiDocsURL } from '../../lib/command/api-command.js'
import { chooseScene } from '../../lib/command/util/scenes-util.js'


export type CommandArgs =
	& APICommandFlags
	& {
		id?: string
	}

const command = 'scenes:execute [id]'

const describe = 'execute a scene'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('id', { describe: 'scene id', type: 'string' })
		.example([
			['$0 scenes:execute', 'prompt for a scene to execute and then execute it'],
			[
				'$0 scenes:execute 699c7308-8c72-4363-9571-880d0f5cc725',
				'execute the scene with the specified id',
			],
		])
		.epilog(apiDocsURL('executeScene'))


const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const sceneId = await chooseScene(command, argv.id)

	const result = await command.client.scenes.execute(sceneId)
	if (result.status === SuccessStatusValue.status) {
		console.log('Scene executed successfully')
	} else {
		console.error(`Error "${result.status}" executing ${sceneId}.`)
	}
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
