import { APICommand } from '@smartthings/cli-lib'


export default class LogoutCommand extends APICommand<typeof LogoutCommand.flags> {
	static flags = APICommand.flags

	async run(): Promise<void> {
		if (this.token) {
			this.log(`Profile ${this.profileName} is set up using a PAT.`)
			this.exit()
		}

		this.authenticator.logout && await this.authenticator.logout()
		this.log('logged out')
	}
}
