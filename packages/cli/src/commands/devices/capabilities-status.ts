import { APICommand } from '@smartthings/cli-lib'


export default class DevicesCapabilitiesStatus extends APICommand {
	static description = 'get the current status of a device component\'s capability'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'the device id',
		required: true
	},{
		name: 'componentId',
		description: 'the component id',
		required: true
	},{
		name: 'capabilityId',
		description: 'the capability id',
		required: true
	}]

	async run(): Promise<void> {
		const { args, flags } = this.parse(DevicesCapabilitiesStatus)
		super.setup(args, flags)

		this.client.devices.getCapabilitiesStatus(args.id, args.componentId, args.capabilityId).then(async status => {
			this.log(JSON.stringify(status, null, 4))
		})
	}
}
