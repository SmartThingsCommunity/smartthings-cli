import { APICommand, chooseDevice } from '@smartthings/cli-lib'


export default class DeviceDeleteCommand extends APICommand<typeof DeviceDeleteCommand.flags> {
	static description = 'delete a device'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'device UUID',
	}]

	async run(): Promise<void> {
		const id = await chooseDevice(this, this.args.id)

		await this.client.devices.delete(id)
		this.log(`Device ${id} deleted.`)
	}
}
