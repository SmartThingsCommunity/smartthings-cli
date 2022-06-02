import { APICommand, selectFromList } from '@smartthings/cli-lib'
import { DeviceIntegrationType } from '@smartthings/core-sdk'


export default class VirtualDeviceDeleteCommand extends APICommand<typeof VirtualDeviceDeleteCommand.flags> {
	static description = 'delete a virtual device'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'device UUID',
	}]

	async run(): Promise<void> {
		const config = {
			primaryKeyName: 'deviceId',
			sortKeyName: 'name',
		}
		const id = await selectFromList(this, config, {
			preselectedId: this.args.id,
			listItems: () => this.client.devices.list({ type: DeviceIntegrationType.VIRTUAL }),
			promptMessage: 'Select device to delete.',
		})
		await this.client.devices.delete(id)
		this.log(`Device ${id} deleted.`)
	}
}
