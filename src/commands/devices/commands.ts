import { flags } from '@oclif/command'

import APICommand from '../../api-command'
import { devices } from '@smartthings/rest-client'


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

	private executeAndDisplay(id: string, commands: devices.Command[]): void {
		try {
			this.client.devices.executeCommands(id, commands)
		} catch (err) {
			this.log(`caught error ${err}`)
		}
	}

	async run(): Promise<void> {
		const { args, flags } = this.parse(DevicesCommands)
		super.setup(args, flags)

		if (flags.data) {
			const commandsIn: devices.CommandList = JSON.parse(flags.data)
			this.executeAndDisplay(args.id, commandsIn.commands)
		} else {
			const stdin = process.stdin
			const inputChunks: string[] = []
			stdin.resume()
			stdin.on('data', chunk => {
				this.log(`pushing chunk ${chunk}`)
				inputChunks.push(chunk)
			})
			stdin.on('end', () => {
				const commandsIn = JSON.parse(inputChunks.join())
				this.executeAndDisplay(args.id, commandsIn.commands)
			})
		}
	}
}
