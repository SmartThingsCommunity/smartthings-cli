import { DeviceActivity } from '@smartthings/core-sdk'

import {
	APICommand,
	buildOutputFormatter,
	calculateOutputFormat,
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
import { chooseLocation } from '../locations.js'


export default class LocationDeviceHistoryCommand extends APICommand<typeof LocationDeviceHistoryCommand.flags> {
	static description = 'get device history by location'

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
		const limit = this.flags.limit
		const perRequestLimit = calculateRequestLimit(limit)

		const id = await chooseLocation(this, this.args.id, true, true)
		const params = {
			locationId: id,
			limit: this.flags.limit,
			before: toEpochTime(this.flags.before),
			after: toEpochTime(this.flags.after),
		}

		if (calculateOutputFormat(this) === 'common') {
			if (limit > perRequestLimit) {
				this.log(`History is limited to ${maxItemsPerRequest} items per request.`)
			}
			const history = await this.client.history.devices(params)
			await writeDeviceEventsTable(this, history, { includeName: true, utcTimeFormat: this.flags.utc })
		} else {
			const items = await getHistory(this.client, limit, perRequestLimit, params)
			const outputFormatter = buildOutputFormatter<DeviceActivity[]>(this)
			await writeOutput(outputFormatter(items), this.flags.output)
		}
	}
}
