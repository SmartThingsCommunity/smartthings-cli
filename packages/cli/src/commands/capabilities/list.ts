import { OutputAPICommand } from '@smartthings/cli-lib'

import { buildListTableOutput, getCustomByNamespace, CapabilitySummaryWithNamespace } from '../capabilities'


// TODO: update to new style
export default class CapabilitiesList extends OutputAPICommand<CapabilitySummaryWithNamespace[]> {
	static description = 'list all capabilities currently available in a user account'

	static flags = OutputAPICommand.flags

	static args = [
		{
			name: 'namespace',
			description: 'the namespace that custom capabilities are assigned to',
		},
	]

	getCustomByNamespace = getCustomByNamespace

	protected buildTableOutput = buildListTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesList)
		await super.setup(args, argv, flags)

		this.processNormally(async () => this.getCustomByNamespace(args.namespace))
	}
}
