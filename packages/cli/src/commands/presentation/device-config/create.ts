import { PresentationDeviceConfigCreate, PresentationDeviceConfig } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../device-config.js'


export default class DeviceConfigCreateCommand extends APICommand<typeof DeviceConfigCreateCommand.flags> {
	static description = 'create a device config' +
		this.apiDocsURL('createDeviceConfiguration')

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
	}

	async run(): Promise<void> {
		await inputAndOutputItem<PresentationDeviceConfigCreate, PresentationDeviceConfig>(this,
			{ buildTableOutput: data => buildTableOutput(this.tableGenerator, data) },
			(_, deviceConfig) => this.client.presentation.create(deviceConfig))
	}
}
