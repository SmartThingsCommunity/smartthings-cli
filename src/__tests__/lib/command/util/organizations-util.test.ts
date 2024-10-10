import { jest } from '@jest/globals'

import type {
	OrganizationResponse,
} from '@smartthings/core-sdk'

import {
	InputDefinition,
	selectDef,
	staticDef,
	undefinedDef,
} from '../../../../lib/item-input/index.js'


const selectDefMock = jest.fn<typeof selectDef>()
const staticDefMock = jest.fn<typeof staticDef>()
const undefinedDefMock = {} as typeof undefinedDef
jest.unstable_mockModule('../../../../lib/item-input/index.js', () => ({
	selectDef: selectDefMock,
	staticDef: staticDefMock,
	undefinedDef: undefinedDefMock,
}))


const { organizationDef } = await import('../../../../lib/command/util/organizations-util.js')


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
