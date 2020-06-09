import { CapabilityPresentation, CapabilityPresentationUpdate } from '@smartthings/core-sdk'
import { SelectingInputOutputAPICommandBase } from '@smartthings/cli-lib'

import { buildTableOutput } from '../presentation'
import { CapabilityId, capabilityIdInputArgs, CapabilitySummaryWithNamespace,
	getCustomByNamespace, getIdFromUser } from '../../capabilities'


export default class CapabilitiesPresentationUpdate extends SelectingInputOutputAPICommandBase<CapabilityId, CapabilityPresentationUpdate, CapabilityPresentation, CapabilitySummaryWithNamespace> {
	static description = 'update presentation information of a capability'

	static flags = SelectingInputOutputAPICommandBase.flags

	static args = capabilityIdInputArgs

	primaryKeyName = 'id'
	sortKeyName = 'id'

	protected tableHeadings(): string[] {
		return ['id', 'version', 'status']
	}

	protected buildObjectTableOutput = buildTableOutput
	private getCustomByNamespace = getCustomByNamespace
	protected getIdFromUser = getIdFromUser

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesPresentationUpdate)
		await super.setup(args, argv, flags)

		const idOrIndex = args.version
			? { id: args.id, version: args.version }
			: args.id
		this.processNormally(idOrIndex,
			async () => this.getCustomByNamespace(),
			async (id, capabilityPresentation) => this.client.capabilities.updatePresentation(id.id, id.version, capabilityPresentation))
	}
}
