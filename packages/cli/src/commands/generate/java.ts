import GenerateCommand from '../../lib/generate-command'


export default class GenerateJava extends GenerateCommand {
	static description = 'generate a Java starter app'

	static flags = GenerateCommand.flags

	async run(): Promise<void> {
		this.parse(GenerateJava)
		await this.generate('smartthings:java')
	}
}
