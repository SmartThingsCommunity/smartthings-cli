import { APICommand } from '@smartthings/cli-lib'


export default class DevicesComponentsStatus extends APICommand {
	static description = 'get the status of all attributes of a the component'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'the device id',
		required: true,
	},{
		name: 'componentId',
		description: 'the component id',
		required: true,
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DevicesComponentsStatus)
		await super.setup(argv, flags)

		this.client.devices.getComponentStatus(args.id, args.componentId).then(async status => {
			this.log(JSON.stringify(status, null, 4))
		})
	}
}
