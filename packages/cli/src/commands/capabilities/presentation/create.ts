import { SelectingInputOutputAPICommandBase } from '@smartthings/cli-lib'
import { CapabilityPresentationCreate, CapabilityPresentation } from '@smartthings/core-sdk'

import { buildTableOutput } from '../presentation'
import { capabilityIdInputArgs, getCustomByNamespace, getIdFromUser,
	CapabilityId, CapabilitySummaryWithNamespace } from '../../capabilities'


export default class CapabilitiesPresentationCreate extends SelectingInputOutputAPICommandBase<CapabilityId, CapabilityPresentationCreate, CapabilityPresentation, CapabilitySummaryWithNamespace> {
	static description = 'create presentation model for a capability'

	static flags = SelectingInputOutputAPICommandBase.flags

	static args = capabilityIdInputArgs

	primaryKeyName = 'id'
	sortKeyName = 'id'

	protected listTableFieldDefinitions = ['id', 'version']

	protected getIdFromUser: (items: CapabilitySummaryWithNamespace[]) => Promise<CapabilityId> = items => getIdFromUser(this, items)

	protected getInputFromUser(): Promise<CapabilityPresentationCreate> {
		return Promise.reject('Q & A not yet implemented')
		// const capability = await this.client.capabilities.get(args.id, args.version)
		// this.log(`CAPABILITY:\n${JSON.stringify(capability, null, 4)}`)

		// Add an item for each attribute on the details page.
		// for (const attributeName in capability.attributes) {
		// 	this.log(`\nATTRIBUTE:\n${JSON.stringify(capability.attributes[attributeName], null, 4)}`)
		// }

		// this.log(`\n\nPRESENTATION:\n${JSON.stringify(presentation, null, 4)}`)
		// const saved = await this.client.capabilities.createPresentation(args.id, args.version, presentation)
		// this.log(`presentation = ${JSON.stringify(saved)}`)
	}

	protected buildTableOutput: (data: CapabilityPresentation) => string = (data) => buildTableOutput(this.tableGenerator, data)

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesPresentationCreate)
		await super.setup(args, argv, flags)

		const idOrIndex = args.version
			? { id: args.id, version: args.version }
			: (args.id ? { id: args.id, version: 1 } : undefined)
		await this.processNormally(idOrIndex,
			async () => getCustomByNamespace(this.client),
			async (id, presentation) => this.client.capabilities.createPresentation(id.id, id.version, presentation))
	}
}
