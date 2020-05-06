import { CapabilityUpdate, Capability } from '@smartthings/core-sdk'
import { InputOutputAPICommand } from '@smartthings/cli-lib'

import { buildTableOutput, capabilityIdInputArgs } from '../capabilities'


export default class CapabilitiesUpdate extends InputOutputAPICommand<CapabilityUpdate, Capability> {
	static description = 'update a capability'

	static flags = InputOutputAPICommand.flags

	static args = capabilityIdInputArgs

	protected buildTableOutput(capability: Capability): string {
		return buildTableOutput(capability)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesUpdate)
		await super.setup(args, argv, flags)

		this.processNormally(capability => {
			return this.client.capabilities.update(args.id, args.version, capability)
		})
	}
}
