import { Flags } from '@oclif/core'

import { Capability, CapabilitySummary } from '@smartthings/core-sdk'

import {
	APIOrganizationCommand, outputItemOrListGeneric, allOrganizationsFlags, forAllOrganizations, OutputItemOrListConfig,
} from '@smartthings/cli-lib'

import {
	buildTableOutput, CapabilityId, capabilityIdOrIndexInputArgs, getCustomByNamespace, getStandard,
	translateToId,
} from '../lib/commands/capabilities-util'


export default class CapabilitiesCommand extends APIOrganizationCommand<typeof CapabilitiesCommand.flags> {
	static description = 'get a specific capability'

	static flags = {
		...APIOrganizationCommand.flags,
		...outputItemOrListGeneric.flags,
		...allOrganizationsFlags,
		namespace: Flags.string({
			char: 'n',
			description: 'a specific namespace to query; will use all by default',
		}),
		standard: Flags.boolean({
			char: 's',
			description: 'show standard SmartThings capabilities',
		}),
	}

	static args = capabilityIdOrIndexInputArgs

	async run(): Promise<void> {
		const idOrIndex = this.args.version ? { id: this.args.id, version: this.args.version } : this.args.id
		const sortKeyName = 'id'
		const config: OutputItemOrListConfig<Capability, CapabilitySummary> = {
			primaryKeyName: 'id',
			sortKeyName,
			listTableFieldDefinitions: ['id', 'version', 'status'],
			buildTableOutput: (data: Capability) => buildTableOutput(this.tableGenerator, data),
		}
		await outputItemOrListGeneric(this, config, idOrIndex,
			() => {
				if (this.flags.standard) {
					return getStandard(this.client)
				} else if (this.flags['all-organizations']) {
					config.listTableFieldDefinitions.push('organization')
					return forAllOrganizations(this.client, orgClient => getCustomByNamespace(orgClient, this.flags.namespace))
				}
				return getCustomByNamespace(this.client, this.flags.namespace)
			},
			(id: CapabilityId) => this.client.capabilities.get(id.id, id.version),
			(idOrIndex, listFunction) => translateToId(sortKeyName, idOrIndex, listFunction))
	}
}
