import { Command, flags } from '@oclif/command'

import { cliConfig } from '@smartthings/cli-lib'


export default class Config extends Command {
	static description = 'describe the command here'

	static flags = {
		help: flags.help({ char: 'h' }),
		// flag with a value (-n, --name=VALUE)
		name: flags.string({ char: 'n', description: 'name to print' }),
		// flag with no value (-f, --force)
		force: flags.boolean({ char: 'f' }),
	}

	static args = [{ name: 'file' }]

	async run(): Promise<void> {
		const { args, flags } = this.parse(Config)
		const profile = cliConfig.getProfile('dev')
		this.log(`read profile:\n${JSON.stringify(profile, null, 4)}`)

		const name = flags.name || 'world'
		this.log(`hello ${name} from config.ts`)
		if (args.file && flags.force) {
			this.log(`you input --force and --file: ${args.file}`)
		}
	}
}
