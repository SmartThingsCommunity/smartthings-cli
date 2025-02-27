import { type AttributeState } from '@smartthings/core-sdk'


const complicatedAttribute: AttributeState = {
	value: {
		name: 'Entity name',
		id: 'entity-id',
		description: 'It is very big and huge and long so the serialized JSON is over 50 characters.',
		version: 1,
		precision: 120.375,
	},
}
const prettyPrintedComplicatedAttribute = JSON.stringify(complicatedAttribute.value, null, 2)

const {
	prettyPrintAttribute,
} = await import('../../../../lib/command/util/devices.js')


test.each([
	{ attribute: { value: null }, expected: '' },
	{ attribute: { value: undefined }, expected: '' },
	{ attribute: {}, expected: '' },
	{ attribute: { value: 100 }, expected: '100' },
	{ attribute: { value: 128, unit: 'yobibytes' }, expected: '128 yobibytes' },
	{ attribute: { value: 21.5 }, expected: '21.5' },
	{ attribute: { value: 'active' }, expected: '"active"' },
	{ attribute: { value: { x: 1, y: 2 } }, expected: '{"x":1,"y":2}' },
	{ attribute: complicatedAttribute, expected: prettyPrintedComplicatedAttribute },
])('prettyPrintAttribute returns $expected when given $attribute', ({ attribute, expected }) => {
	expect(prettyPrintAttribute(attribute)).toBe(expected)
})
