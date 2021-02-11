import { APICommand, selectFromList } from '@smartthings/cli-lib'


export default class DeviceDeleteCommand extends APICommand {
	static description = 'delete a device'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'device UUID',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceDeleteCommand)
		await super.setup(args, argv, flags)

		const config = {
			primaryKeyName: 'deviceId',
			sortKeyName: 'name',
		}
		const id = await selectFromList(this, config, args.id,
			() => this.client.devices.list(),
			'Select device to delete.')
		await this.client.devices.delete(id)
		this.log(`Device ${id} deleted.`)
	}
}
