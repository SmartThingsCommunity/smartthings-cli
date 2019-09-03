import { Command, flags } from '@oclif/command'
import yeoman from 'yeoman-environment'


export default abstract class GenerateCommand extends Command {
	static flags = {
		help: flags.help({ char: 'h' }),
	}

	async generate(name: string): Promise<void> {
		const env = yeoman.createEnv()
		env.lookup(() => {
			env.run(name, (err) => {
				if (err) {
					console.log(`failed to run yeoman: ${err}`)
				}
			})
		})
	}
}
