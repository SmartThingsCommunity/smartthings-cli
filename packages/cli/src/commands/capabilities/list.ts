import { APICommand } from '@smartthings/cli-lib'


export default class CapabilitiesList extends APICommand {
	static description = 'list all capabilities currently available in a user account'

	static flags = {
		...APICommand.flags,
		...APICommand.jsonOutputFlags,
	}

	async run(): Promise<void> {
		const { args, flags } = this.parse(CapabilitiesList)
		await super.setup(args, flags)

		this.client.capabilities.list().then(async capabilities => {
			this.log(JSON.stringify(capabilities, null, 4))
		}).catch(err => {
			this.log(`caught error ${err}`)
		})
	}
}
