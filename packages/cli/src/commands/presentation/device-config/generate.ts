import { Flags } from '@oclif/core'

import { PresentationDeviceConfig, HttpClientParams } from '@smartthings/core-sdk'

import { APICommand, outputItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../device-config'


export default class GeneratePresentationCommand extends APICommand<typeof GeneratePresentationCommand.flags> {
	static description = 'generate the default device configuration'

	static flags = {
		...APICommand.flags,
		...outputItem.flags,
		dth: Flags.boolean({
			description: 'generate from legacy DTH id instead of a profile id',
		}),
		'type-shard-id': Flags.string({
			description: 'data management shard Id where the device type resides, ' +
				'only useful for legacy DTH type integrations',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the profile id (or legacy DTH id))',
		required: true,
	}]

	async run(): Promise<void> {
		const extraParams: HttpClientParams = {}
		if (this.flags.dth) {
			extraParams.typeIntegration = 'dth'
			if (this.args['type-shard-id']) {
				extraParams.typeShareId = this.args['type-shard-id']
			}
		}
		this.logger.debug(`extraParams = ${JSON.stringify(extraParams)}`)

		const config = {
			buildTableOutput: (data: PresentationDeviceConfig) => buildTableOutput(this.tableGenerator, data),
		}
		await outputItem<PresentationDeviceConfig>(this, config,
			() => this.client.presentation.generate(this.args.id, extraParams))
	}
}
