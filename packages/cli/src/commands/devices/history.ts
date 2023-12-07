import { DeviceActivity } from '@smartthings/core-sdk'

import {
	APICommand,
	buildOutputFormatter,
	calculateOutputFormat,
	chooseDevice,
	formatAndWriteItem,
	IOFormat,
	writeOutput,
} from '@smartthings/cli-lib'

import {
	calculateRequestLimit,
	getHistory,
	historyFlags,
	maxItemsPerRequest,
	toEpochTime,
	writeDeviceEventsTable,
} from '../../lib/commands/history-util.js'


export default class DeviceHistoryCommand extends APICommand<typeof DeviceHistoryCommand.flags> {
	static description = 'get device history by device'

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
		const limit = this.flags.limit
		const perRequestLimit = calculateRequestLimit(limit)

		const deviceId = await chooseDevice(this, this.args.id, { allowIndex: true })
		const device = await this.client.devices.get(deviceId)
		const params = {
			deviceId,
			locationId: device.locationId,
			limit: perRequestLimit,
			before: toEpochTime(this.flags.before),
			after: toEpochTime(this.flags.after),
		}

		if (calculateOutputFormat(this) === 'common') {
			if (limit > perRequestLimit) {
				this.log(`History is limited to ${maxItemsPerRequest} items per request.`)
			}
			const history = await this.client.history.devices(params)
			await writeDeviceEventsTable(this, history, { utcTimeFormat: this.flags.utc })
		} else {
			const items = await getHistory(this.client, limit, perRequestLimit, params)
			const outputFormatter = buildOutputFormatter<DeviceActivity[]>(this)
			await writeOutput(outputFormatter(items), this.flags.output)
		}
	}
}
