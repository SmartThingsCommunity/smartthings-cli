import { PresentationDeviceConfigCreate, PresentationDeviceConfig } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../device-config'


export default class DeviceConfigCreateCommand extends APICommand {
	static description = 'create a device config'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
	}

	async run(): Promise<void> {
		const { args, argv, flags } = await this.parse(DeviceConfigCreateCommand)
		await super.setup(args, argv, flags)

		await inputAndOutputItem<PresentationDeviceConfigCreate, PresentationDeviceConfig>(this,
			{ buildTableOutput: data => buildTableOutput(this.tableGenerator, data) },
			(_, deviceConfig) => this.client.presentation.create(deviceConfig))
	}
}
