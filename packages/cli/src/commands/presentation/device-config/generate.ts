import { flags } from '@oclif/command'

import { PresentationDeviceConfig, HttpClientParams } from '@smartthings/core-sdk'

import { APICommand, outputItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../device-config'


export default class GeneratePresentationCommand extends APICommand {
	static description = 'generate the default device configuration'

	static flags = {
		...APICommand.flags,
		...outputItem.flags,
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

	buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(GeneratePresentationCommand)
		await super.setup(args, argv, flags)

		const extraParams: HttpClientParams = {}
		if (flags.dth) {
			extraParams.typeIntegration = 'dth'
			if (args['type-shard-id']) {
				extraParams.typeShareId = args['type-shard-id']
			}
		}
		this.logger.debug(`extraParams = ${JSON.stringify(extraParams)}`)

		await outputItem<PresentationDeviceConfig>(this, () => this.client.presentation.generate(args.id, extraParams))
	}
}
