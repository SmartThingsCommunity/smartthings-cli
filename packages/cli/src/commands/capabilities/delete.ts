import { APICommand, selectGeneric } from '@smartthings/cli-lib'

import { capabilityIdInputArgs, getCustomByNamespace, getIdFromUser } from '../capabilities'


export default class CapabilitiesDeleteCommand extends APICommand {
	static description = 'delete a capability'

	static flags = APICommand.flags

	static args = capabilityIdInputArgs

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesDeleteCommand)
		await super.setup(args, argv, flags)

		const optionalId = args.id ? { id: args.id, version: args.version ?? 1 } : undefined
		const config = {
			primaryKeyName: 'id',
			sortKeyName: 'id',
			listTableFieldDefinitions: ['id', 'version'],
		}
		const capabilityId = await selectGeneric(this, config, optionalId,
			() => getCustomByNamespace(this.client), getIdFromUser)
		await this.client.capabilities.delete(capabilityId.id, capabilityId.version)
		this.log(`Capability ${capabilityId.id} (version ${capabilityId.version}) deleted.`)
	}
}
