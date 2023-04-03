import { Flags } from '@oclif/core'
import { Mode, ModeRequest } from '@smartthings/core-sdk'
import { APICommand, CommonOutputProducer, inputAndOutputItem } from '@smartthings/cli-lib'
import { chooseMode, tableFieldDefinitions } from '../../../lib/commands/locations/modes-util'


export default class ModesUpdateCommand extends APICommand<typeof ModesUpdateCommand.flags> {
	static description = 'update a mode'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		location: Flags.string({
			char: 'l',
			description: 'a specific location to query',
			helpValue: '<UUID>',
		}),
	}

	static args = [{
		name: 'id',
		description: 'mode UUID',
	}]

	static examples = [
		{ description: 'select a mode from a list of all modes and update it using the data in new-data.json', command: 'smartthings locations:modes:update -i=new-data.json' },
		{ description: 'select a mode from a list of modes in a specified location and update it using the data in new-data.json', command: 'smartthings locations:modes:update --location=5dfd6626-ab1d-42da-bb76-90def3153998 -i=new-data.json' },
		{ description: 'update a specified mode using the data in new-data.json', command: 'smartthings locations:modes:update 636169e4-8b9f-4438-a941-953b0d617231 -i=new-data.json' },
	]

	async run(): Promise<void> {
		const [modeId, locationId] = await chooseMode(this, this.flags.location, this.args.id)
		const config: CommonOutputProducer<Mode> = { tableFieldDefinitions }
		await inputAndOutputItem<ModeRequest, Mode>(this, config,
			(_, data) => this.client.modes.update(modeId, data, locationId))
	}
}
