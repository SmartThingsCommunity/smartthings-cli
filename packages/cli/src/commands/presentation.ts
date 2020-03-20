import fs from 'fs'

import { APICommand } from '@smartthings/cli-lib'


export default class Presentation extends APICommand {
	static description = 'get or generate a device configuration based on type or profile.'

	static flags = {
		...APICommand.flags,
		...APICommand.outputFlags,
	}

	static args = [
		{
			name: 'id',
			description: 'the profile id',
			required: true,
		},
	]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(Presentation)
		await super.setup(argv, flags)

		this.client.presentation.get(args.id).then(async deviceConfig => {
			//Create the output content based on flags
			const output = JSON.stringify(deviceConfig, null, flags.indent || 4)
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
