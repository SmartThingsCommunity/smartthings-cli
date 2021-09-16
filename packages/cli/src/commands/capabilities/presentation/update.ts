import { CapabilityPresentation, CapabilityPresentationUpdate } from '@smartthings/core-sdk'

import { APIOrganizationCommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../presentation'
import { capabilityIdInputArgs, chooseCapability } from '../../capabilities'


export default class CapabilitiesPresentationUpdate extends APIOrganizationCommand {
	static description = 'update presentation information of a capability'

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = capabilityIdInputArgs

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesPresentationUpdate)
		await super.setup(args, argv, flags)

		const id = await chooseCapability(this, args.id, args.version)
		await inputAndOutputItem<CapabilityPresentationUpdate, CapabilityPresentation>(this,
			{ buildTableOutput: data => buildTableOutput(this.tableGenerator, data) },
			(_, capabilityPresentation) => this.client.capabilities.updatePresentation(id.id, id.version, capabilityPresentation))
	}
}
