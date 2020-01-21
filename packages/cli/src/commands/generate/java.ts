import GenerateCommand from '../../lib/generate-command'

export default class GenerateJava extends GenerateCommand {
	static description = 'Generate a Java starter app'

	static flags = GenerateCommand.flags

	async run(): Promise<void> {
		this.parse(GenerateJava)
		this.generate('smartthings:java')
	}
}
