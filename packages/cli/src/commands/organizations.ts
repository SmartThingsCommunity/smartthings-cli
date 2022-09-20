import { APICommand, outputItemOrList, OutputItemOrListConfig, TableFieldDefinition } from '@smartthings/cli-lib'
import { OrganizationResponse } from '@smartthings/core-sdk'


export const tableFieldDefinitions: TableFieldDefinition<OrganizationResponse>[] = [
	'name', 'label', 'organizationId', 'developerGroupId', 'adminGroupId', 'warehouseGroupId',
	{
		prop: 'isDefaultUserOrg',
		value: (i: OrganizationResponse): string | undefined => i.isDefaultUserOrg?.toString(),
	},
	{
		prop: 'manufacturerName',
		include: (i: OrganizationResponse): boolean => i.manufacturerName !== undefined,
	},
	{
		prop: 'mnid',
		include: (i: OrganizationResponse): boolean => i.mnid !== undefined,
	},
]

export default class OrganizationsCommand extends APICommand<typeof OrganizationsCommand.flags> {
	static description = 'list all organizations the user belongs to'

	static flags = {
		...APICommand.flags,
		...outputItemOrList.flags,
	}

	static args = [{
		name: 'id',
		description: 'the organization name, id or index',
	}]

	async run(): Promise<void> {
		const config: OutputItemOrListConfig<OrganizationResponse> = {
			tableFieldDefinitions,
			primaryKeyName: 'organizationId',
			sortKeyName: 'name',
			listTableFieldDefinitions: ['name', 'label', 'organizationId', 'isDefaultUserOrg'],
		}

		await outputItemOrList(this, config, this.args.id,
			() => this.client.organizations.list(),
			id => this.client.organizations.get(id),
		)
	}
}
