import inquirer from 'inquirer'
import { Errors, Flags } from '@oclif/core'

import { DeviceActivity, DeviceHistoryRequest, PaginatedList, SmartThingsClient } from '@smartthings/core-sdk'

import { SmartThingsCommandInterface, Table } from '@smartthings/cli-lib'


// The history endpoints will only return 300 items maximum per request, no matter what the limit is set to.
export const maxItemsPerRequest = 300

export const maxRequestsBeforeWarning = 6

export interface DeviceActivityOptions {
	includeName?: boolean
	utcTimeFormat?: boolean
}

export const historyFlags = {
	after: Flags.string({
		char: 'A',
		description: 'return events newer than or equal to this timestamp, expressed as an epoch time in milliseconds or an ISO time string',
	}),
	before: Flags.string({
		char: 'B',
		description: 'return events older than than this timestamp, expressed as an epoch time in milliseconds or an ISO time string',
	}),
	limit: Flags.integer({
		char: 'L',
		description: 'maximum number of events to return',
		default: 20,
	}),
	utc: Flags.boolean({
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
		const row = [
			options.utcTimeFormat ? date.toISOString() : date.toLocaleString(),
			item.component,
			item.capability,
			item.attribute,
			item.unit ? `${value} ${item.unit}` : value,
		]
		if (options.includeName) {
			row.splice(1, 0, item.deviceName)
		}
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

export const calculateRequestLimit = (limit: number): number =>
	limit > maxItemsPerRequest ? maxItemsPerRequest : limit

export const getHistory = async (client: SmartThingsClient, limit: number, perRequestLimit: number,
		params: DeviceHistoryRequest): Promise<DeviceActivity[]> => {
	// if limit is > ${maxHistoryItemsPerRequest} we need a loop;
	// warn user if more than some number of requests will be made
	if (limit > perRequestLimit) {
		const requestsToMake = Math.ceil(limit / maxItemsPerRequest)
		if (requestsToMake > maxRequestsBeforeWarning) {
			// prompt user if it's okay to continue
			const answer = (await inquirer.prompt({
				type: 'list',
				name: 'answer',
				message: `Querying ${limit} history items will result in ${requestsToMake} requests.\n` +
					'Are you sure you want to continue?',
				choices: [
					{ name: 'Yes, I understand this might take a long time and/or hit API rate limits.', value: 'yes' },
					{ name: 'No, cancel the request.', value: 'cancel' },
					{ name: `Continue but limit results to ${maxItemsPerRequest * maxRequestsBeforeWarning}`, value: 'reduce' },
				],
			})).answer as string
			if (answer === 'reduce') {
				limit = maxRequestsBeforeWarning * maxItemsPerRequest
			} else if (answer === 'cancel') {
				throw new Errors.CLIError('user canceled request')
			}
		}
	}
	const history = await client.history.devices(params)
	const items: DeviceActivity[] = [...history.items]
	while (items.length < limit && history.hasNext()) {
		await history.next()
		items.push(...history.items.slice(0, limit - items.length))
	}
	return items
}
