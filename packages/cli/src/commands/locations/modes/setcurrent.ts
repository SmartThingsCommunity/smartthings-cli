import { Flags } from '@oclif/core'
import { APICommand } from '@smartthings/cli-lib'
import { chooseMode } from '../../../lib/commands/locations/modes-util'


export default class SetCurrentModeCommand extends APICommand<typeof SetCurrentModeCommand.flags> {
	static description = 'set the current mode'

	static flags = {
		...APICommand.flags,
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
		{ description: 'select a mode from a list of all modes and set it to be current for its location', command: 'smartthings locations:modes:setcurrent' },
		{ description: 'select a mode from a list of modes in a specified location and set it to be current', command: 'smartthings locations:modes:setcurrent --location=5dfd6626-ab1d-42da-bb76-90def3153998' },
		{ description: 'set the specified mode to be current for its location', command: 'smartthings locations:modes:setcurrent 636169e4-8b9f-4438-a941-953b0d617231' },
	]

	async run(): Promise<void> {
		const [modeId, locationId] = await chooseMode(this, this.flags.location, this.args.id)
		await this.client.modes.setCurrent(modeId, locationId)

		const mode = await this.client.modes.get(modeId, locationId)
		const modeString = mode.label ?? mode.name ?? 'unnamed mode'
		const location = await this.client.locations.get(locationId)

		this.log(`current mode for ${location.name} (${location.locationId}) set to ${modeString} (${mode.id})`)
	}
}
