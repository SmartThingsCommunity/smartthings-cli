import GenerateCommand from '../../lib/generate-command'


export default class GenerateNode extends GenerateCommand {
	static description = 'generate a NodeJS starter app'

	static flags = GenerateCommand.flags

	async run(): Promise<void> {
		this.parse(GenerateNode)
		this.generate('smartthings:node')
	}
}
