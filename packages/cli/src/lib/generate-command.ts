import { createEnv } from 'yeoman-environment'

import { SmartThingsCommand } from '@smartthings/cli-lib'


export default abstract class GenerateCommand extends SmartThingsCommand {
	static flags = SmartThingsCommand.flags

	async generate(name: string): Promise<void> {
		const env = createEnv()
		env.lookup(undefined, () => {
			env.run(name, (err) => {
				if (err) {
					this.log(`failed to run yeoman: ${err}`)
				}
			})
		})
	}
}
