import { jest } from '@jest/globals'

import type { CapabilityAttribute, CapabilityAttributeSchema } from '@smartthings/core-sdk'

import type { attributeTypeDisplayString } from '../../../../lib/command/util/capabilities-util.js'

import {
	newOutputTableMock,
	tableGeneratorMock,
	tablePushMock,
	tableToStringMock,
} from '../../../test-lib/table-mock.js'


const attributeTypeDisplayStringMock = jest.fn<typeof attributeTypeDisplayString>()
jest.unstable_mockModule('../../../../lib/command/util/capabilities-util.js', () => ({
	attributeTypeDisplayString: attributeTypeDisplayStringMock,
}))


const { buildTableOutput } = await import('../../../../lib/command/util/capabilities-table.js')


describe('buildTableOutput', () => {
	const baseCapability = { id: 'capability-id', name: 'Name' }

	it('starts with name and id', () => {
		const result = buildTableOutput(tableGeneratorMock, baseCapability)

		expect(result).toStartWith('Capability: Name (capability-id)\n')
		expect(newOutputTableMock).toHaveBeenCalledTimes(0)
	})

	it('skips attributes and commands entirely when not included', () => {
		const result = buildTableOutput(tableGeneratorMock, baseCapability)

		expect(result).not.toContain('Attributes')
		expect(result).not.toContain('Commands')
		expect(newOutputTableMock).toHaveBeenCalledTimes(0)
	})

	it('skips attributes and commands entirely when included but empty', () => {
		const capability = {
			...baseCapability,
			attributes: {},
			commands: {},
		}

		const result = buildTableOutput(tableGeneratorMock, capability)

		expect(result).not.toContain('Attributes')
		expect(result).not.toContain('Commands')
		expect(newOutputTableMock).toHaveBeenCalledTimes(0)
	})

	it('includes attributes', () => {
		const attr1Schema: CapabilityAttributeSchema = {
			type: 'object',
			properties: { value: { type: 'number' } },
			additionalProperties: false,
		}
		const attr2Schema: CapabilityAttributeSchema = {
			type: 'object',
			properties: { value: { type: 'string' } },
			additionalProperties: false,
		}
		const attr1: CapabilityAttribute = { schema: attr1Schema, setter: 'setAttr1' }
		const attr2: CapabilityAttribute = { schema: attr2Schema  }
		const capability = {
			...baseCapability,
			attributes: { attr1, attr2 },
		}

		attributeTypeDisplayStringMock.mockReturnValueOnce('attr1 display type')
		attributeTypeDisplayStringMock.mockReturnValueOnce('attr2 display type')
		tableToStringMock.mockReturnValueOnce('attribute table')

		const result = buildTableOutput(tableGeneratorMock, capability)

		expect(result).toContain('\n\nAttributes: \nattribute table')
		expect(result).not.toContain('Commands')

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(attributeTypeDisplayStringMock).toHaveBeenCalledTimes(2)
		expect(attributeTypeDisplayStringMock).toHaveBeenCalledWith(attr1Schema.properties.value)
		expect(attributeTypeDisplayStringMock).toHaveBeenCalledWith(attr2Schema.properties.value)
		expect(tablePushMock).toHaveBeenCalledTimes(2)
		expect(tablePushMock).toHaveBeenCalledWith(['attr1', 'attr1 display type', 'setAttr1'])
		expect(tablePushMock).toHaveBeenCalledWith(['attr2', 'attr2 display type', ''])
		expect(tableToStringMock).toHaveBeenCalledTimes(1)
		expect(tableToStringMock).toHaveBeenCalledWith()
	})

	it('includes commands', () => {
		const command1 = {
			name: 'turnOn',
		}
		const command2 = {
			name: 'turnOff',
		}
		const capability = {
			...baseCapability,
			commands: { command1, command2 },
		}

		tableToStringMock.mockReturnValueOnce('command table')

		const result = buildTableOutput(tableGeneratorMock, capability)

		expect(result).toContain('\n\nCommands: \ncommand table')
		expect(result).not.toContain('Attributes')

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(attributeTypeDisplayStringMock).toHaveBeenCalledTimes(0)
		expect(tablePushMock).toHaveBeenCalledTimes(2)
		expect(tablePushMock).toHaveBeenCalledWith(['command1', ''])
		expect(tablePushMock).toHaveBeenCalledWith(['command2', ''])
		expect(tableToStringMock).toHaveBeenCalledTimes(1)
		expect(tableToStringMock).toHaveBeenCalledWith()
	})

	it('displays optional arguments with "(optional)"', () => {
		const command = {
			name: 'setString',
			arguments: [{ name: 'value', optional: true, schema: { type: 'string' } }],
		}
		const capability = {
			...baseCapability,
			commands: { command },
		}

		attributeTypeDisplayStringMock.mockReturnValueOnce('arg 1 display type')
		tableToStringMock.mockReturnValueOnce('command table')

		const result = buildTableOutput(tableGeneratorMock, capability)

		expect(result).toContain('\n\nCommands: \ncommand table')
		expect(result).not.toContain('Attributes')

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(attributeTypeDisplayStringMock).toHaveBeenCalledTimes(1)
		expect(attributeTypeDisplayStringMock).toHaveBeenCalledWith(command.arguments[0].schema)
		expect(tablePushMock).toHaveBeenCalledTimes(1)
		expect(tablePushMock).toHaveBeenCalledWith(['command', 'value: arg 1 display type (optional)'])
		expect(tableToStringMock).toHaveBeenCalledTimes(1)
		expect(tableToStringMock).toHaveBeenCalledWith()
	})

	it('displays required arguments using `attributeTypeDisplayString`', () => {
		const command = {
			name: 'setString',
			arguments: [{ name: 'value', schema: { type: 'string' } }],
		}
		const capability = {
			...baseCapability,
			commands: { command },
		}

		attributeTypeDisplayStringMock.mockReturnValueOnce('arg 1 display type')
		tableToStringMock.mockReturnValueOnce('command table')

		const result = buildTableOutput(tableGeneratorMock, capability)

		expect(result).toContain('\n\nCommands: \ncommand table')
		expect(result).not.toContain('Attributes')

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(attributeTypeDisplayStringMock).toHaveBeenCalledTimes(1)
		expect(attributeTypeDisplayStringMock).toHaveBeenCalledWith(command.arguments[0].schema)
		expect(tablePushMock).toHaveBeenCalledTimes(1)
		expect(tablePushMock).toHaveBeenCalledWith(['command', 'value: arg 1 display type'])
		expect(tableToStringMock).toHaveBeenCalledTimes(1)
		expect(tableToStringMock).toHaveBeenCalledWith()
	})
})
