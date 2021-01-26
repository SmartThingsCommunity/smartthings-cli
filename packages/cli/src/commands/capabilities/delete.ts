import { APICommand, selectAndActOnGeneric } from '@smartthings/cli-lib'

import {
	capabilityIdInputArgs,
	getCapabilityIdFromUser,
	getCustomByNamespace,
} from '../capabilities'


export default class CapabilitiesDeleteCommand extends APICommand {
	static description = 'delete a capability'

	static flags = APICommand.flags

	static args = capabilityIdInputArgs

	primaryKeyName = 'id'
	sortKeyName = 'id'

	protected listTableFieldDefinitions = ['id', 'version']

	private getCustomByNamespace = getCustomByNamespace

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesDeleteCommand)
		await super.setup(args, argv, flags)

		const optionalId = args.id ? { id: args.id, version: args.version ?? 1 } : undefined
		await selectAndActOnGeneric(this,
			optionalId,
			() => this.getCustomByNamespace(),
			async id => { await this.client.capabilities.delete(id.id, id.version) },
			getCapabilityIdFromUser,
			'capability {{id}} deleted')
	}
}
