import { CapabilityUpdate, Capability } from '@smartthings/core-sdk'
import { SelectingInputOutputAPICommandBase } from '@smartthings/cli-lib'

import { buildTableOutput, capabilityIdInputArgs, getCustomByNamespace, getIdFromUser,
	CapabilityId, CapabilitySummaryWithNamespace } from '../capabilities'


export default class CapabilitiesUpdate extends SelectingInputOutputAPICommandBase<CapabilityId, CapabilityUpdate, Capability, CapabilitySummaryWithNamespace> {
	static description = 'update a capability'

	static flags = SelectingInputOutputAPICommandBase.flags

	static args = capabilityIdInputArgs

	primaryKeyName = 'id'
	sortKeyName = 'id'

	protected listTableFieldDefinitions = ['id', 'version']

	protected buildTableOutput = buildTableOutput
	private getCustomByNamespace = getCustomByNamespace
	protected getIdFromUser = getIdFromUser

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesUpdate)
		await super.setup(args, argv, flags)

		const idOrIndex = args.version
			? { id: args.id, version: args.version }
			: args.id
		this.processNormally(idOrIndex,
			async () => this.getCustomByNamespace(),
			async (id, capability) => this.client.capabilities.update(id.id, id.version, capability))
	}
}
