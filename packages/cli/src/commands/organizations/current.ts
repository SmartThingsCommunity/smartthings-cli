import { APIOrganizationCommand, formatAndWriteItem, outputItem } from '@smartthings/cli-lib'

import { tableFieldDefinitions } from '../organizations'


export default class OrganizationCurrentCommand extends APIOrganizationCommand<typeof OrganizationCurrentCommand.flags> {
	static description = 'return the currently active organization'

	static flags = {
		...APIOrganizationCommand.flags,
		...outputItem.flags,
	}

	static args = []

	async run(): Promise<void> {
		let currentOrganization
		const currentOrganizationId = this.stringConfigValue('organization')
		if (currentOrganizationId) {
			currentOrganization = await this.client.organizations.get(currentOrganizationId)
		} else {
			currentOrganization = (await this.client.organizations.list()).find(org => org.isDefaultUserOrg)
		}

		if (currentOrganization) {
			await formatAndWriteItem(this, { tableFieldDefinitions }, currentOrganization)
		} else {
			this.warn(`Organization '${currentOrganizationId}' not found`)
		}
	}
}
