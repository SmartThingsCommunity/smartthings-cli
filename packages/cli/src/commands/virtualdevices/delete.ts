import { APICommand, chooseDevice } from '@smartthings/cli-lib'
import { DeviceIntegrationType } from '@smartthings/core-sdk'


export default class VirtualDeviceDeleteCommand extends APICommand<typeof VirtualDeviceDeleteCommand.flags> {
	static description = 'delete a virtual device'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'device UUID',
	}]

	async run(): Promise<void> {
		const id = await chooseDevice(this, this.args.id, {
			deviceListOptions: { type: DeviceIntegrationType.VIRTUAL },
		})
		await this.client.devices.delete(id)
		this.log(`Device ${id} deleted.`)
	}
}
