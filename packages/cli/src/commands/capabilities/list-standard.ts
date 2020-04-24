import { OutputAPICommand } from '@smartthings/cli-lib'

import { buildTableOutput } from './list'
import { CapabilitySummary } from '@smartthings/core-sdk'


export default class CapabilitiesListStandard extends OutputAPICommand<CapabilitySummary[]> {
	static description = 'list all capabilities currently available in a user account'

	static flags = {
		...OutputAPICommand.flags,
	}

	protected buildTableOutput(capabilities: CapabilitySummary[]): string {
		return buildTableOutput(capabilities)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesListStandard)
		await super.setup(args, argv, flags)

		this.processNormally(() => {
			return this.client.capabilities.listStandard()
		})
	}
}
