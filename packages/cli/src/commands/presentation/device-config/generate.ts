import { Flags } from '@oclif/core'

import { PresentationDeviceConfig, HttpClientParams } from '@smartthings/core-sdk'

import { APICommand, outputItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../device-config.js'


export default class GeneratePresentationCommand extends APICommand<typeof GeneratePresentationCommand.flags> {
	static description = 'generate the default device configuration' +
		this.apiDocsURL('generateDeviceConfig')

	static flags = {
		...APICommand.flags,
		...outputItem.flags,
		dth: Flags.boolean({
			description: 'generate from legacy DTH id instead of a profile id',
		}),
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'type-shard': Flags.string({
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
			if (this.flags['type-shard']) {
				extraParams.typeShareId = this.flags['type-shard']
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
