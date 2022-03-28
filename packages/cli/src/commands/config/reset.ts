import { CliUx } from '@oclif/core'
import inquirer from 'inquirer'

import { resetManagedConfig, SmartThingsCommand } from '@smartthings/cli-lib'


export default class ConfigResetCommand extends SmartThingsCommand {
	static description = 'clear saved answers to questions\n' +
		'The CLI will occasionally ask you if you want it to remember the answer to a question, such as ' +
		'"Which hub do you want to use?" You can use this command to clear those answers.'

	static flags = SmartThingsCommand.flags

	async run(): Promise<void> {
		const { args, argv, flags } = await this.parse(ConfigResetCommand)
		await super.setup(args, argv, flags)

		const confirmed: boolean = (await inquirer.prompt({
			type: 'confirm',
			name: 'confirmed',
			message: `Are you sure you want to clear saved answers to questions${this.profileName === 'default' ? '' : ` for the profile ${this.profileName}`}?`,
		})).confirmed

		if (confirmed) {
			await resetManagedConfig(this.cliConfig, this.profileName)
			CliUx.ux.log('Configuration has been reset.')
		} else {
			CliUx.ux.log('Configuration reset canceled.')
		}
	}
}
