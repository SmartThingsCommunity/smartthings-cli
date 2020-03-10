import { APICommand } from '@smartthings/cli-lib'


export default class Devices extends APICommand {
	static description = "get device's description"

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'the device id',
		required: true,
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(Devices)
		await super.setup(argv, flags)

		this.client.devices.get(args.id).then(async device => {
			this.log(JSON.stringify(device, null, 4))
		})
	}
}
