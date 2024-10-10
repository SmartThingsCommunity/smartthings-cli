import {
	type OrganizationResponse,
} from '@smartthings/core-sdk'

import {
	type InputDefinition,
	selectDef,
	staticDef,
	undefinedDef,
} from '../../item-input/index.js'


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
			name: organization.name,
			value: organization.organizationId,
		}))

	const helpText = `The organization with which the ${chosenFor} should be associated.`

	return selectDef('Organization', choices, { helpText })
}
