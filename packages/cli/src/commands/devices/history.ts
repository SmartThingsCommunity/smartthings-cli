import {
	APICommand,
	buildOutputFormatter,
	calculateOutputFormat,
	chooseDevice,
	formatAndWriteItem,
	IOFormat,
	writeOutput,
} from '@smartthings/cli-lib'
import { historyFlags, toEpochTime, writeDeviceEventsTable } from '../../lib/commands/history-util'


export default class DeviceHistoryCommand extends APICommand<typeof DeviceHistoryCommand.flags> {
	static description = 'get the current preferences of a device'

	static flags = {
		...APICommand.flags,
		...formatAndWriteItem.flags,
		...historyFlags,
	}

	static args = [{
		name: 'id',
		description: 'the device id',
	}]

	async run(): Promise<void> {
		const deviceId = await chooseDevice(this, this.args.id, { allowIndex: true })
		const device = await this.client.devices.get(deviceId)
		const params = {
			deviceId,
			locationId: device.locationId,
			limit: this.flags.limit,
			before: toEpochTime(this.flags.before),
			after: toEpochTime(this.flags.after),
		}

		const history = await this.client.history.devices(params)

		if (calculateOutputFormat(this) === IOFormat.COMMON) {
			await writeDeviceEventsTable(this, history, { utcTimeFormat: this.flags.utc })
		} else {
			const outputFormatter = buildOutputFormatter(this)
			await writeOutput(outputFormatter(history.items), this.flags.output)
		}
	}
}
