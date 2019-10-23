import yeoman from 'yeoman-environment'

import SmartThingsCommand from '../smartthings-command'


export default abstract class GenerateCommand extends SmartThingsCommand {
	static flags = SmartThingsCommand.flags

	async generate(name: string): Promise<void> {
		const env = yeoman.createEnv()
		env.lookup(() => {
			env.run(name, (err) => {
				if (err) {
					this.log(`failed to run yeoman: ${err}`)
				}
			})
		})
	}
}
