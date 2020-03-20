import fs from 'fs'
import yaml from 'js-yaml'

import { APICommand } from '@smartthings/cli-lib'
import { PresentationDeviceConfig } from '@smartthings/core-sdk'


export default class PresentationCreate extends APICommand {
	static description = 'get or generate a device configuration based on type or profile.'

	static flags = {
		...APICommand.flags,
		...APICommand.inputFlags,
	}

	private display(deviceConfig: PresentationDeviceConfig): void {
		//Create the output content based on flags
		if(this.flags){
			const output = JSON.stringify(deviceConfig, null, this.flags.indent || 4)
			this.log(output)
		}
	}

	async run(): Promise<void> {
		const { argv, flags } = this.parse(PresentationCreate)
		await super.setup(argv, flags)

		if (flags.input) {
			fs.readFile(flags.input, (err, data) => {
				if (err) {
					this.error(`Error reading input file: ${err}`)
				}
				this.client.presentation.getOrCreate(yaml.safeLoad(data.toString()) as PresentationDeviceConfig)
					.then(deviceConfig => this.display(deviceConfig))
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
				const deviceConfig = JSON.parse(inputChunks.join())
				this.client.presentation.getOrCreate(deviceConfig as PresentationDeviceConfig)
					.then(deviceConfig => this.display(deviceConfig))
					.catch(err => {
						this.log(`caught error ${err}`)
					})
			})
		}
	}
}
