import { Device, PresentationDevicePresentation } from '@smartthings/core-sdk'

import { ListingOutputAPICommand } from '@smartthings/cli-lib'

import { buildTableOutput } from '../presentation'


export const tableFieldDefinitions = ['clientName', 'scope', 'redirectUris']

export default class DevicePresentationCommand extends ListingOutputAPICommand<PresentationDevicePresentation, Device> {
	static description = 'get a device presentation'

	static flags = ListingOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the device id or number in the list',
	}]

	primaryKeyName = 'deviceId'
	sortKeyName = 'label'

	protected buildTableOutput(presentation: PresentationDevicePresentation): string {
		return buildTableOutput(presentation, this.tableGenerator)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DevicePresentationCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => this.client.devices.list(),
			(id) => this.client.devices.getPresentation(id),
		)
	}
}
