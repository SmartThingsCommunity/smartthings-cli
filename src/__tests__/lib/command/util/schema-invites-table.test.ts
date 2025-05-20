import type { SchemaAppInvitation } from '@smartthings/core-sdk'

import type { ValueTableFieldDefinition } from '../../../../lib/table-generator.js'


const { tableFieldDefinitions } = await import('../../../../lib/command/util/schema-invites-table.js')


test.each`
	input           | expected
	${undefined}    | ${'none'}
	${1694617703}   | ${'2023-09-13T15:08:23.000Z'}
`('expiration displays $expected for $input', ({ input, expected }) => {
	const value = (tableFieldDefinitions[2] as
		ValueTableFieldDefinition<SchemaAppInvitation>).value as (input: SchemaAppInvitation) => string
	expect(value({ expiration: input } as SchemaAppInvitation)).toBe(expected)
})
