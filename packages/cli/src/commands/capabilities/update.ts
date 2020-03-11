import fs from 'fs'
import { flags } from '@oclif/command'

import { APICommand } from '@smartthings/cli-lib'
import { CapabilityUpdate } from '@smartthings/core-sdk'

import { CapabilityLogging } from '../capabilities'



export default class CapabilitiesUpdate extends APICommand {
	static description = 'update a capability'

	static flags = {
		...APICommand.flags,
		...APICommand.inputFlags,
		...APICommand.jsonFlags,
		data: flags.string({
			char: 'd',
			description: 'JSON data for capability',
		}),
	}

	static args = [
		{
			name: 'id',
			description: 'the capability id',
			required: true,
		},
		{
			name: 'version',
			description: 'the capability version',
			required: true,
		},
	]

	private updateAndDisplay(capabilityId: string, capabilityVersion: number, capability: CapabilityUpdate): void {
		this.client.capabilities.update(capabilityId, capabilityVersion, capability)
			.then(updatedCapability => {
				if(this.flags && this.flags.json){
					this.log(JSON.stringify(updatedCapability, null, this.flags['json-space'] || 4))
				} else {
					new CapabilityLogging().printCapabilityTable(updatedCapability)
				}
			})
			.catch(err => {
				this.log(`caught error ${err}`)
			})
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesUpdate)
		await super.setup(argv, flags)

		if (flags.data) {
			const capability: CapabilityUpdate = JSON.parse(flags.data)
			this.updateAndDisplay(args.id, args.version, capability)
		} else if(flags.input) {
			fs.readFile(flags.input, (err, data) => {
				if (err) {
					this.error(`Error reading input file: ${err}`)
				}
				this.updateAndDisplay(args.id, args.version, JSON.parse(data.toString()))
			})
		} else {
			const stdin = process.stdin
			const inputChunks: string[] = []
			stdin.resume()
			stdin.on('data', chunk => {
				inputChunks.push(chunk.toString())
			})
			stdin.on('end', () => {
				const capability = JSON.parse(inputChunks.join())
				this.updateAndDisplay(args.id, args.version, capability)
			})
		}
	}
}
