import GenerateCommand from '../../lib/generate-command'


export default class GenerateNode extends GenerateCommand {
	static description = 'generate a NodeJS starter app'

	static flags = GenerateCommand.flags

	async run(): Promise<void> {
		await this.parse(GenerateNode)
		await this.generate('smartthings:node')
	}
}
