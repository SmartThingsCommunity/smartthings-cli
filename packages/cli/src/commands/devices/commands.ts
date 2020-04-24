import { flags } from '@oclif/command'

import { Command, CommandList } from '@smartthings/core-sdk'

import { APICommand } from '@smartthings/cli-lib'


export default class DevicesCommands extends APICommand {
	static description = 'execute commands on a device'

	static flags = {
		...APICommand.flags,
		data: flags.string({
			char: 'd',
			description: 'JSON data for command(s)',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the device on which you want to execute a command',
		required: true,
	}]

	private async executeAndDisplay(id: string, commands: Command[]): Promise<void> {
		await this.client.devices.executeCommands(id, commands)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DevicesCommands)
		await super.setup(args, argv, flags)

		if (flags.data) {
			const commandsIn: CommandList = JSON.parse(flags.data)
			await this.executeAndDisplay(args.id, commandsIn.commands)
		} else {
			const stdin = process.stdin
			const inputChunks: string[] = []
			stdin.resume()
			stdin.on('data', chunk => {
				inputChunks.push(chunk.toString())
			})
			stdin.on('end', async () => {
				const commandsIn = JSON.parse(inputChunks.join())
				await this.executeAndDisplay(args.id, commandsIn.commands)
			})
		}
	}
}
