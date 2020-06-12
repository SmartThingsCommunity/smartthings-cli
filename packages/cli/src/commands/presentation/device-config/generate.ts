import { flags } from '@oclif/command'

import { PresentationDeviceConfig, HttpClientParams } from '@smartthings/core-sdk'

import { OutputAPICommand } from '@smartthings/cli-lib'

import { buildTableOutput } from '../device-config'


export default class Devices extends OutputAPICommand<PresentationDeviceConfig> {
	static description = 'generate the default device configuration'

	static flags = {
		...OutputAPICommand.flags,
		dth: flags.boolean({
			description: 'generate from legacy DTH id instead of a profile id',
		}),
		'type-shard-id': flags.string({
			description: 'data management shard Id where the device type resides, ' +
				'only useful for legacy DTH type integrations',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the profile id (or legacy DTH id))',
		required: true,
	}]

	protected buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(Devices)
		await super.setup(args, argv, flags)

		const extraParams: HttpClientParams = {}
		if (flags.dth) {
			extraParams.typeIntegration = 'dth'
			if (args['type-shard-id']) {
				extraParams.typeShareId = args['type-shard-id']
			}
		}
		this.logger.debug(`extraParams = ${JSON.stringify(extraParams)}`)

		this.processNormally(() => {
			return this.client.presentation.generate(args.id, extraParams)
		})
	}
}
