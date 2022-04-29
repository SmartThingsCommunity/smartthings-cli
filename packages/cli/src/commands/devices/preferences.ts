import { DevicePreferenceResponse } from '@smartthings/core-sdk'

import { APICommand, chooseDevice, formatAndWriteItem, TableGenerator } from '@smartthings/cli-lib'


export function buildTableOutput(tableGenerator: TableGenerator, data: DevicePreferenceResponse): string {
	let output = ''
	if (data.values) {
		const table = tableGenerator.newOutputTable({head: ['Name', 'Type','Value']})
		const names = Object.keys(data.values).sort()
		for (const name of names) {
			const item = data.values[name]
			if (item) {
				table.push([
					name,
					item.preferenceType,
					item.value,
				])
			}
		}
		output = table.toString()
	}
	return output
}

export default class DevicePreferencesCommand extends APICommand<typeof DevicePreferencesCommand.flags> {
	static description = 'get the current preferences of a device'

	static flags = {
		...APICommand.flags,
		...formatAndWriteItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'the device id',
	}]

	async run(): Promise<void> {
		const deviceId = await chooseDevice(this, this.args.id, { allowIndex: true })
		const preferences = await this.client.devices.getPreferences(deviceId)
		await formatAndWriteItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) }, preferences)
	}
}
