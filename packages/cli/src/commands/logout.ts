import { APICommand } from '@smartthings/cli-lib'


export default class LogoutCommand extends APICommand {
	static flags = APICommand.flags

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(LogoutCommand)
		await super.setup(args, argv, flags)

		if (this.token) {
			this.log(`Profile ${this.profileName} is set up using a PAT.`)
			this.exit()
		}

		this.authenticator.logout && await this.authenticator.logout()
		this.log('logged out')
	}
}
