import { type OrganizationResponse } from '@smartthings/core-sdk'

import { type TableFieldDefinition } from '../../table-generator.js'
import {
	type InputDefinition,
	selectDef,
	staticDef,
	undefinedDef,
} from '../../item-input/index.js'
import { type ChooseFunction, createChooseFn } from './util-util.js'


export const organizationDef = (
		chosenFor: string,
		organizations: OrganizationResponse[],
): InputDefinition<string | undefined> => {
	if (organizations.length < 1) {
		return undefinedDef
	}
	if (organizations.length === 1) {
		return staticDef(organizations[0].organizationId)
	}

	const choices = organizations
		.map(organization => ({
			name: organization.label ? `${organization.name} (${organization.label})` : organization.name,
			value: organization.organizationId,
		}))

	const helpText = `The organization with which the ${chosenFor} should be associated.`

	return selectDef('Organization', choices, { helpText })
}

export const chooseOrganizationFn = (): ChooseFunction<OrganizationResponse> => createChooseFn(
	{
		itemName: 'organization',
		primaryKeyName: 'organizationId',
		sortKeyName: 'name',
		listTableFieldDefinitions: ['name', 'label', 'organizationId'],
	},
	command => command.client.organizations.list(),
)
export const chooseOrganization = chooseOrganizationFn()

export const tableFieldDefinitions: TableFieldDefinition<OrganizationResponse>[] = [
	'name', 'label', 'organizationId', 'developerGroupId', 'adminGroupId', 'warehouseGroupId',
	{
		prop: 'isDefaultUserOrg',
		value: (i: OrganizationResponse): string | undefined => i.isDefaultUserOrg?.toString(),
	},
	{
		prop: 'manufacturerName',
		skipEmpty: true,
	},
	{
		prop: 'mnid',
		skipEmpty: true,
	},
]
