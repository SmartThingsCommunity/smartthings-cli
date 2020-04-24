import { InputOutputAPICommand } from '@smartthings/cli-lib'
import { CapabilityPresentationCreate, CapabilityPresentation } from '@smartthings/core-sdk'

import { buildTableOutput } from '../presentation'
import CapabilitiesPresentationCreate from './create'


export default class CapabilitiesPresentationUpdate extends InputOutputAPICommand<CapabilityPresentationCreate, CapabilityPresentation> {
	static description = 'update presentation model for a capability'

	static flags = {
		...InputOutputAPICommand.flags,
	}

	static args = CapabilitiesPresentationCreate.args

	protected buildTableOutput(presentation: CapabilityPresentation): string {
		return buildTableOutput(presentation)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesPresentationUpdate)
		await super.setup(args, argv, flags)

		this.processNormally(presentation => {
			return this.client.capabilities.updatePresentation(args.id, args.version, presentation)
		})
	}
}
