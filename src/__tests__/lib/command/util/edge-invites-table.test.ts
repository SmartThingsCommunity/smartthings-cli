import { type ValueTableFieldDefinition } from '../../../../lib/table-generator.js'
import { listTableFieldDefinitions } from '../../../../lib/command/util/edge-invites-table.js'
import { type Invitation } from '../../../../lib/edge/endpoints/invites.js'


test.each([
	{ expiration: undefined, expected: '' },
	{ expiration: 1744214546, expected: '2025-04-09T16:02:26.000Z' },
])('expiration value function', ({ expiration, expected }) => {
	const valueFunction = (listTableFieldDefinitions[3] as ValueTableFieldDefinition<Invitation>).value

	expect(valueFunction({ expiration } as Invitation)).toBe(expected)
})
