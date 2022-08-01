import {
	APICommand,
	buildOutputFormatter,
	calculateOutputFormat,
	formatAndWriteItem,
	IOFormat,
	writeOutput,
} from '@smartthings/cli-lib'
import { historyFlags, toEpochTime, writeDeviceEventsTable } from '../../lib/commands/history-util'
import { chooseLocation } from '../locations'


export default class LocationDeviceHistoryCommand extends APICommand<typeof LocationDeviceHistoryCommand.flags> {
	static description = 'get the current preferences of a device'

	static flags = {
		...APICommand.flags,
		...formatAndWriteItem.flags,
		...historyFlags,
	}

	static args = [{
		name: 'id',
		description: 'the location id',
	}]

	async run(): Promise<void> {
		const id = await chooseLocation(this, this.args.id, true, true)

		const params = {
			locationId: id,
			limit: this.flags.limit,
			before: toEpochTime(this.flags.before),
			after: toEpochTime(this.flags.after),
		}

		const history = await this.client.history.devices(params)

		if (calculateOutputFormat(this) === IOFormat.COMMON) {
			await writeDeviceEventsTable(this, history, { includeName: true, utcTimeFormat: this.flags.utc })
		} else {
			const outputFormatter = buildOutputFormatter(this)
			await writeOutput(outputFormatter(history.items), this.flags.output)
		}
	}
}
