import { flags } from '@oclif/command'

import { Command, CommandList } from '@smartthings/smartthings-core-js/dist/core-public/devices'

import APICommand from '../../api-command'


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
		required: true
	}]

	private executeAndDisplay(id: string, commands: Command[]): void {
		try {
			this.client.devices.executeCommands(id, commands)
		} catch (err) {
			this.log(`caught error ${err} attempting to execute command`)
		}
	}

	async run(): Promise<void> {
		const { args, flags } = this.parse(DevicesCommands)
		super.setup(args, flags)

		if (flags.data) {
			const commandsIn: CommandList = JSON.parse(flags.data)
			this.executeAndDisplay(args.id, commandsIn.commands)
		} else {
			const stdin = process.stdin
			const inputChunks: string[] = []
			stdin.resume()
			stdin.on('data', chunk => {
				inputChunks.push(chunk)
			})
			stdin.on('end', () => {
				const commandsIn = JSON.parse(inputChunks.join())
				this.executeAndDisplay(args.id, commandsIn.commands)
			})
		}
	}
}
