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

	protected buildTableOutput: (data: Capability) => string = data => buildTableOutput(this.tableGenerator, data)
	protected getIdFromUser: (items: CapabilitySummaryWithNamespace[]) => Promise<CapabilityId> = items => getIdFromUser(this, items)

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesUpdate)
		await super.setup(args, argv, flags)

		const idOrIndex = args.version
			? { id: args.id, version: args.version }
			: args.id
		await this.processNormally(idOrIndex,
			async () => getCustomByNamespace(this.client),
			async (id, capability) => this.client.capabilities.update(id.id, id.version, capability))
	}
}
