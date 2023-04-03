import { Flags } from '@oclif/core'
import { Mode, ModeRequest } from '@smartthings/core-sdk'
import { APICommand, CommonOutputProducer, inputAndOutputItem } from '@smartthings/cli-lib'
import { chooseLocation } from '../../locations'
import { tableFieldDefinitions } from '../../../lib/commands/locations/modes-util'


export default class ModesCreateCommand extends APICommand<typeof ModesCreateCommand.flags> {
	static description = 'create a mode'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		location: Flags.string({
			char: 'l',
			description: 'a specific location to create the mode in',
			helpValue: '<UUID>',
		}),
	}

	static examples = [
		{ description: 'create a new mode using the data in new-data.json', command: 'smartthings locations:modes:create -i=new-data.json' },
		{ description: 'create a new mode in a specified location using the data in new-data.json', command: 'smartthings locations:modes:create --location=5dfd6626-ab1d-42da-bb76-90def3153998 -i=new-data.json' },
	]

	async run(): Promise<void> {
		const locationId = await chooseLocation(this, this.flags.location)
		const config: CommonOutputProducer<Mode> = { tableFieldDefinitions }
		await inputAndOutputItem<ModeRequest, Mode>(this, config,
			(_, mode) => this.client.modes.create(mode, locationId))
	}
}
