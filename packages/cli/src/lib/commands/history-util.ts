import inquirer from 'inquirer'
import { SmartThingsCommandInterface, Table } from '@smartthings/cli-lib'
import { DeviceActivity, PaginatedList } from '@smartthings/core-sdk'
import { Flags } from '@oclif/core'


export interface DeviceActivityOptions {
	includeName?: boolean
	utcTimeFormat?: boolean
}

export const historyFlags = {
	'after': Flags.string({
		char: 'A',
		description: 'return events newer than or equal to this timestamp, expressed as an epoch time in milliseconds or an ISO time string',
	}),
	'before': Flags.string({
		char: 'B',
		description: 'return events older than than this timestamp, expressed as an epoch time in milliseconds or an ISO time string',
	}),
	'limit': Flags.integer({
		char: 'L',
		description: 'maximum number of events to return, defaults to 20',
	}),
	'utc': Flags.boolean({
		char: 'U',
		description: 'display times in UTC time zone. Defaults to local time',
	}),
}

export function toEpochTime(date?: string): number | undefined {
	if (date) {
		return new Date(date).getTime()
	}
}

export function sortEvents(list: DeviceActivity[]): DeviceActivity[] {
	return list.sort((a, b) => a.epoch === b.epoch ? 0 : (a.epoch < b.epoch ? 1 : -1))
}

export function getNextDeviceEvents(table: Table, items: DeviceActivity[], options: Partial<DeviceActivityOptions>): void {
	for (const item of items) {
		const date = new Date(item.time)
		const value = JSON.stringify(item.value)
		const row = options.includeName ? [
			options.utcTimeFormat ? date.toISOString() : date.toLocaleString(),
			item.deviceName,
			item.component,
			item.capability,
			item.attribute,
			item.unit ? `${value} ${item.unit}` : value,
		] : [
			options.utcTimeFormat ? date.toISOString() : date.toLocaleString(),
			item.component,
			item.capability,
			item.attribute,
			item.unit ? `${value} ${item.unit}` : value,
		]
		table.push(row)
	}
}

export async function writeDeviceEventsTable(
		command: SmartThingsCommandInterface,
		data:  PaginatedList<DeviceActivity>,
		options?: Partial<DeviceActivityOptions>): Promise<void> {

	const opts = { includeName: false, utcTimeFormat: false, ...options }
	const head = options && options.includeName ?
		['Time', 'Device Name', 'Component', 'Capability', 'Attribute', 'Value'] :
		['Time', 'Component', 'Capability', 'Attribute', 'Value']

	if (data.items) {
		let table = command.tableGenerator.newOutputTable({ isList: true, head })
		getNextDeviceEvents(table, sortEvents(data.items), opts)
		process.stdout.write(table.toString())

		let more = 'y'
		while (more.toLowerCase() !== 'n' && data.hasNext()) {
			more = (await inquirer.prompt({
				type: 'input',
				name: 'more',
				message: 'Fetch more history records ([y]/n)?',
			})).more

			if (more.toLowerCase() !== 'n') {
				table = command.tableGenerator.newOutputTable({ isList: true, head })
				await data.next()
				if (data.items.length) {
					getNextDeviceEvents(table, sortEvents(data.items), opts)
					process.stdout.write(table.toString())
				}
			}
		}
	}
}
