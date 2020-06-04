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

	protected tableHeadings(): string[] {
		return ['id', 'version']
	}

	private getCustomByNamespace = getCustomByNamespace
	protected getIdFromUser = getIdFromUser

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

	protected buildObjectTableOutput(presentation: CapabilityPresentation): string {
		return buildTableOutput(presentation)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesPresentationCreate)
		await super.setup(args, argv, flags)

		const idOrIndex = args.version
			? { id: args.id, version: args.version }
			: args.id
		this.processNormally(idOrIndex,
			async () => this.getCustomByNamespace(),
			async (id, presentation) => this.client.capabilities.createPresentation(id.id, id.version, presentation))
	}
}
