import { APICommand, selectAndActOn } from '@smartthings/cli-lib'


export default class DeviceDeleteCommand extends APICommand {
	static description = 'delete a device'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'device UUID',
	}]

	primaryKeyName = 'deviceId'
	sortKeyName = 'name'

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceDeleteCommand)
		await super.setup(args, argv, flags)

		await selectAndActOn(this, args.id,
			() => this.client.devices.list(),
			async id => { await this.client.devices.delete(id) },
			'device {{id}} deleted')
	}
}
