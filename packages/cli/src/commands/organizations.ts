import { APICommand, outputListing } from '@smartthings/cli-lib'
import { OrganizationResponse } from '@smartthings/core-sdk'


export const tableFieldDefinitions = [
	'name', 'label', 'organizationId', 'developerGroupId', 'adminGroupId', 'warehouseGroupId',
	{
		prop: 'isDefaultUserOrg',
		value: (i: OrganizationResponse) => i.isDefaultUserOrg?.toString(),
	},
	{
		prop: 'manufacturerName',
		include: (i: OrganizationResponse) => i.manufacturerName !== undefined,
	},
	{
		prop: 'mnid',
		include: (i: OrganizationResponse) => i.mnid !== undefined,
	},
]

export default class OrganizationsCommand extends APICommand {
	static description = 'list all organizations the user belongs to'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
	}

	static args = [{
		name: 'id',
		description: 'the organization name, id or index',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(OrganizationsCommand)
		await super.setup(args, argv, flags)

		const config = {
			tableFieldDefinitions,
			primaryKeyName: 'organizationId',
			sortKeyName: 'name',
			listTableFieldDefinitions: ['name', 'label', 'organizationId', 'isDefaultUserOrg'],
		}

		await outputListing(this, config, args.id,
			() => this.client.organizations.list(),
			id => this.client.organizations.get(id),
		)
	}
}
