import fs from 'fs'
import yaml from 'js-yaml'

import { APICommand } from '@smartthings/cli-lib'

import { CapabilityDefaultOutput } from '../capabilities'


export default class CapabilitiesListStandard extends APICommand {
	static description = 'list all capabilities currently available in a user account'

	static flags = {
		...APICommand.flags,
		...APICommand.outputFlags,
	}

	async run(): Promise<void> {
		const { argv, flags } = this.parse(CapabilitiesListStandard)
		await super.setup(argv, flags)

		this.client.capabilities.listStandard().then(async capabilities => {
			//Create the output content based on flags
			const capabilityDefaultOutput = new CapabilityDefaultOutput()
			let output

			if (flags.json || capabilityDefaultOutput.allowedOutputFileType(flags.output, true)) {
				output = JSON.stringify(capabilities, null, flags.indent || 4)
			} else if (flags.yaml || capabilityDefaultOutput.allowedOutputFileType(flags.output, false)) {
				output = yaml.safeDump(capabilities, {indent: flags.indent || 2 })
			} else {
				output = capabilityDefaultOutput.makeCapabilitiesTable(capabilities)
			}

			//decide how to output the content based on flags
			if (flags.output) {
				fs.writeFile(flags.output, output, () => {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					this.log(`file created: ${flags.output}`)
				})
			} else {
				this.log(output)
			}
		}).catch(err => {
			this.log(`caught error ${err}`)
		})
	}
}
