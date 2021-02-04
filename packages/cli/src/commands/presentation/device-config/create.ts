import { PresentationDeviceConfigCreate, PresentationDeviceConfig } from '@smartthings/core-sdk'

import { InputOutputAPICommand } from '@smartthings/cli-lib'

import { buildTableOutput } from '../device-config'


export default class DeviceConfigCreate extends InputOutputAPICommand<PresentationDeviceConfigCreate, PresentationDeviceConfig> {
	static description = 'create a device config'

	static flags = InputOutputAPICommand.flags

	protected buildTableOutput: (data: PresentationDeviceConfig) => string = data => buildTableOutput(this.tableGenerator, data)

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceConfigCreate)
		await super.setup(args, argv, flags)

		this.processNormally(deviceConfig => {
			return this.client.presentation.create(deviceConfig)
		})
	}
}
