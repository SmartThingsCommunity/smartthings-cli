import { Flags } from '@oclif/core'
import { APICommand } from '@smartthings/cli-lib'
import { chooseMode } from '../../../lib/commands/locations/modes-util'


export default class ModesDeleteCommand extends APICommand<typeof ModesDeleteCommand.flags> {
	static description = 'delete a mode'

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
		{ description: 'select a mode from a list of all modes and delete it', command: 'smartthings locations:modes:delete' },
		{ description: 'select a mode from a list of modes in a specified location and delete it', command: 'smartthings locations:modes:delete --location=5dfd6626-ab1d-42da-bb76-90def3153998' },
		{ description: 'delete a specified mode', command: 'smartthings locations:modes:delete 636169e4-8b9f-4438-a941-953b0d617231' },
	]

	async run(): Promise<void> {
		const [modeId, locationId] = await chooseMode(this, this.flags.location, this.args.id)

		const mode = await this.client.modes.get(modeId, locationId)
		const modeString = mode.label ?? mode.name ?? 'unnamed mode'

		await this.client.modes.delete(modeId, locationId)

		this.log(`${modeString} (${mode.id}) deleted`)
	}
}
