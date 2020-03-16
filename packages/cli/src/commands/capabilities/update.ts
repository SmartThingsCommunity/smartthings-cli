import fs from 'fs'
import yaml from 'js-yaml'

import { Capability, CapabilityUpdate } from '@smartthings/core-sdk'
import { APICommand } from '@smartthings/cli-lib'

import { CapabilityDefaultOutput } from '../capabilities'


export default class CapabilitiesUpdate extends APICommand {
	static description = 'update a capability'

	static flags = {
		...APICommand.flags,
		...APICommand.inputOutputFlags,
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

	private display(capability: Capability): void {
		//Create the output content based on flags
		const capabilityDefaultOutput = new CapabilityDefaultOutput()
		let output

		if (this.flags && (this.flags.json || capabilityDefaultOutput.allowedOutputFileType(this.flags.output, true))) {
			output = JSON.stringify(capability, null, this.flags.indent || 4)
		} else if (this.flags && (this.flags.yaml || capabilityDefaultOutput.allowedOutputFileType(this.flags.output, false))) {
			output = yaml.safeDump(capability, {indent: this.flags.indent || 2 })
		} else {
			output = capabilityDefaultOutput.makeCapabilityTable(capability)
		}

		//decide how to output the content based on flags
		if (this.flags && this.flags.output) {
			fs.writeFile(this.flags.output, output, () => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				open(this.flags!.output!)
			})
		} else {
			this.log(output)
		}
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesUpdate)
		await super.setup(argv, flags)

		if (flags.input) {
			fs.readFile(flags.input, (err, data) => {
				if (err) {
					this.error(`Error reading input file: ${err}`)
				}
				this.client.capabilities.update(args.id, args.version, yaml.safeLoad(data.toString()) as CapabilityUpdate)
					.then(capability => this.display(capability))
					.catch(err => {
						console.log(err)
						this.log(`caught error ${err}`)
					})
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
				this.client.capabilities.update(args.capabilityId, args.capabilityVersion, capability as CapabilityUpdate)
					.then(capability => this.display(capability))
					.catch(err => {
						this.log(`caught error ${err}`)
					})
			})
		}
	}
}
