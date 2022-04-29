import { APICommand, selectFromList } from '@smartthings/cli-lib'


export default class DeviceDeleteCommand extends APICommand<typeof DeviceDeleteCommand.flags> {
	static description = 'delete a device'

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
			listItems: () => this.client.devices.list(),
			promptMessage: 'Select device to delete.',
		})
		await this.client.devices.delete(id)
		this.log(`Device ${id} deleted.`)
	}
}
