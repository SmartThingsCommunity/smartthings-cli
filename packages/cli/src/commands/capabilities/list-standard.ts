import { CapabilitySummary } from '@smartthings/core-sdk'

import { OutputAPICommand } from '@smartthings/cli-lib'

import { buildListTableOutput } from '../capabilities'


export default class CapabilitiesListStandard extends OutputAPICommand<CapabilitySummary[]> {
	static description = 'list all standard capabilities'

	static flags = OutputAPICommand.flags

	protected buildTableOutput = buildListTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesListStandard)
		await super.setup(args, argv, flags)

		this.processNormally(() => {
			return this.client.capabilities.listStandard()
		})
	}
}
