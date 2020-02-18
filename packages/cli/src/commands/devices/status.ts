import { APICommand } from '@smartthings/cli-lib'


export default class DevicesStatus extends APICommand {
	static description = 'get the current status of all of a device\'s component\'s attributes'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'the device id',
		required: true
	}]

	async run(): Promise<void> {
		const { args, flags } = this.parse(DevicesStatus)
		await super.setup(args, flags)

		this.client.devices.getStatus(args.id).then(async status => {
			this.log(JSON.stringify(status, null, 4))
		})
	}
}
