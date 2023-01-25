import { APICommand, formatAndWriteItem } from '@smartthings/cli-lib'
import { SuccessStatusValue } from '@smartthings/core-sdk'
import { chooseScene } from '../../lib/commands/scenes-util'


export default class ScenesExecuteCommand extends APICommand<typeof ScenesExecuteCommand.flags> {
	static description = 'execute a scene' +
		this.apiDocsURL('executeScene')

	static flags = {
		...APICommand.flags,
		...formatAndWriteItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'scene UUID',
	}]

	static examples = [
		'# prompt for a scene to execute and then execute it',
		'$ smartthings scenes:execute',
		'',
		'# execute the scene with the specified id',
		'$ smartthings scenes:execute 699c7308-8c72-4363-9571-880d0f5cc725',
	]

	async run(): Promise<void> {
		const sceneId = await chooseScene(this, this.args.id)

		const result = await this.client.scenes.execute(sceneId)
		if (result.status === SuccessStatusValue.status) {
			this.log('Scene executed successfully')
		} else {
			this.error(`error ${result.status} executing ${sceneId}`)
		}
	}
}
