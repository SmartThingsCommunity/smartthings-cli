import { jest } from '@jest/globals'

import type { OrganizationResponse, OrganizationsEndpoint } from '@smartthings/core-sdk'

import type { ValueTableFieldDefinition } from '../../../../lib/table-generator.js'
import type { APICommand } from '../../../../lib/command/api-command.js'
import type { createChooseFn, ChooseFunction } from '../../../../lib/command/util/util-util.js'
import type {
	InputDefinition,
	selectDef,
	staticDef,
	undefinedDef,
} from '../../../../lib/item-input/index.js'


const createChooseFnMock = jest.fn<typeof createChooseFn<OrganizationResponse>>()
jest.unstable_mockModule('../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))

const selectDefMock = jest.fn<typeof selectDef>()
const staticDefMock = jest.fn<typeof staticDef>()
const undefinedDefMock = {} as typeof undefinedDef
jest.unstable_mockModule('../../../../lib/item-input/index.js', () => ({
	selectDef: selectDefMock,
	staticDef: staticDefMock,
	undefinedDef: undefinedDefMock,
}))


const {
	chooseOrganizationFn,
	organizationDef,
	tableFieldDefinitions,
} = await import('../../../../lib/command/util/organizations-util.js')


describe('organizationDef', () => {
	const organization1 = { name: 'Organization 1', organizationId: 'organization-id-1' }

	it('returns undefinedDef when given no organizations', () => {
		expect(organizationDef('organization-needing thing', [])).toBe(undefinedDefMock)
	})

	it('returns staticDef for a single organization', () => {
		const mockDef = {} as InputDefinition<string | undefined>
		staticDefMock.mockReturnValueOnce(mockDef)

		expect(organizationDef('organization-needing thing', [organization1])).toBe(mockDef)

		expect(staticDefMock).toHaveBeenCalledExactlyOnceWith('organization-id-1')
	})

	it('returns selectDef for multiple organizations', () => {
		const organization2 = { name: 'Organization 2', organizationId: 'organization-id-2' }
		const organizations = [organization1, organization2] as OrganizationResponse[]
		const mockDef = {} as InputDefinition<string | undefined>
		selectDefMock.mockReturnValueOnce(mockDef)

		expect(organizationDef('organization-needing thing', organizations)).toBe(mockDef)

		const helpText =
			'The organization with which the organization-needing thing should be associated.'
		expect(selectDefMock).toHaveBeenCalledExactlyOnceWith(
			'Organization',
			[
				{ name: 'Organization 1', value: 'organization-id-1' },
				{ name: 'Organization 2', value: 'organization-id-2' },
			],
			{ helpText },
		)
	})
})

test('chooseOrganizationFn uses correct endpoint to list organizations', async () => {
	const chooseOrganizationMock = jest.fn<ChooseFunction<OrganizationResponse>>()
	createChooseFnMock.mockReturnValueOnce(chooseOrganizationMock)

	const chooseOrganization = chooseOrganizationFn()

	expect(chooseOrganization).toBe(chooseOrganizationMock)

	expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({ itemName: 'organization' }),
		expect.any(Function),
	)

	const organizationList = [{ organizationId: 'listed-organization-id' } as OrganizationResponse]
	const apiOrganizationsListMock = jest.fn<typeof OrganizationsEndpoint.prototype.list>()
		.mockResolvedValueOnce(organizationList)
	const listItems = createChooseFnMock.mock.calls[0][1]
	const command = {
		client: {
			organizations: {
				list: apiOrganizationsListMock,
			},
		},
	} as unknown as APICommand

	expect(await listItems(command)).toBe(organizationList)

	expect(apiOrganizationsListMock).toHaveBeenCalledExactlyOnceWith()
})

test.each([
	{ input: { isDefaultUserOrg: false }, expected: 'false' },
	{ input: { isDefaultUserOrg: true }, expected: 'true' },
	{ input: {}, expected: undefined },
])('tableFieldDefinitions isDefaultUserOrg.value returns $expected for $input', ({ input, expected }) => {
	const value = (tableFieldDefinitions[6] as ValueTableFieldDefinition<OrganizationResponse>).value as
		(input: OrganizationResponse) => string
	expect(value(input as OrganizationResponse)).toBe(expected)
})
