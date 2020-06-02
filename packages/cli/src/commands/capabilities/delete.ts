import { SelectingInputAPICommandBase } from '@smartthings/cli-lib'

import { capabilityIdInputArgs, getCustomByNamespace, getIdFromUser,
	CapabilityId, CapabilitySummaryWithNamespace } from '../capabilities'


export default class CapabilitiesDeleteCommand extends SelectingInputAPICommandBase<CapabilityId, CapabilitySummaryWithNamespace> {
	static description = 'delete a capability'

	static flags = SelectingInputAPICommandBase.flags

	static args = capabilityIdInputArgs

	primaryKeyName = 'id'
	sortKeyName = 'id'

	protected tableHeadings(): string[] {
		return ['id', 'version']
	}

	private getCustomByNamespace = getCustomByNamespace
	protected getIdFromUser = getIdFromUser

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesDeleteCommand)
		await super.setup(args, argv, flags)

		this.processNormally(args.id,
			async () => this.getCustomByNamespace(),
			async (id) => { this.client.capabilities.delete(id.id, id.version)},
			'capability {{id}} deleted')
	}
}
