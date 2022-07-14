import inquirer from 'inquirer'

import {
	CapabilityAttribute,
	CapabilityAttributeSchema,
	CapabilityJSONSchema,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import { APIOrganizationCommand, selectFromList, Sorting, summarizedText, Table, TableGenerator } from '@smartthings/cli-lib'

import {
	attributeType,
	buildTableOutput,
	CapabilitySummaryWithNamespace,
	chooseCapability,
	chooseCapabilityFiltered,
	convertToId,
	getAllFiltered,
	getCustomByNamespace,
	getIdFromUser,
	getStandard,
	joinEnums,
	translateToId,
} from '../../../lib/commands/capabilities-util'
import * as capabilitiesUtil from '../../../lib/commands/capabilities-util'


jest.mock('inquirer')

describe('joinEnums', () => {
	it('returns empty string for empty input', () => {
		expect(joinEnums([])).toBe('')
	})

	it('returns single item prefaced with "  - "', () => {
		expect(joinEnums(['small'])).toBe('\n  - small')
	})

	it('combines multiple items', () => {
		expect(joinEnums(['one', 'two', 'three'])).toBe('\n  - one\n  - two\n  - three')
	})
})

describe('attributeType', () => {
	const joinEnumsSpy = jest.spyOn(capabilitiesUtil, 'joinEnums')
	it('lists types of tuple-style array', () => {
		const items: CapabilityJSONSchema[] = [{ type: 'string' }, { type: 'number' }]
		const schema: CapabilityJSONSchema = { type: 'array', items }
		expect(attributeType(schema)).toBe('array[string, number]')
	})

	it('for array, uses "enum" when no type specified but enum field exists', () => {
		const items: CapabilityJSONSchema[] = [{ type: 'string' }, { enum: ['option 1', 'option 2'] }]
		const schema: CapabilityJSONSchema = { type: 'array', items }
		expect(attributeType(schema)).toBe('array[string, enum]')
	})

	it('for array, uses "unknown" when no type or enum field exists', () => {
		const items: CapabilityJSONSchema[] = [{ type: 'string' }, { title: 'not typed' }]
		const schema: CapabilityJSONSchema = { type: 'array', items }
		expect(attributeType(schema)).toBe('array[string, unknown]')
	})

	it('includes type of array with type', () => {
		const schema = { type: 'array', items: { type: 'string' } }
		expect(attributeType(schema)).toBe('array<string>')
	})

	it('returns "array" for array with no type(s) specified', () => {
		const schema = { type: 'array' }
		expect(attributeType(schema)).toBe('array')
	})

	it('returns object as properties list surrounded by {}', () => {
		const schema = {
			type: 'object',
			properties: { prop1: { type: 'string' }, prop2: { title: 'untyped' } },
		}
		expect(attributeType(schema)).toBe('{\n  prop1: string\n  prop2: undefined\n}')
	})

	it('for object, uses "title" when no properties provided', () => {
		const schema = { type: 'object', title: 'obj title' }
		expect(attributeType(schema)).toBe('obj title')
	})

	it('for object, uses "object" when no properties or title provided', () => {
		const schema = { type: 'object' }
		expect(attributeType(schema)).toBe('object')
	})

	it('for object, uses joinEnums for enum', () => {
		joinEnumsSpy.mockReturnValueOnce(':joined enums')
		const schema = { enum: ['option 1', 'option 2'] }

		expect(attributeType(schema)).toBe('enum:joined enums')

		expect(joinEnumsSpy).toHaveBeenCalledTimes(1)
		expect(joinEnumsSpy).toHaveBeenCalledWith(schema.enum)
	})

	it('uses type name for types not specifically handled', () => {
		const schema = { type: 'other type' }
		expect(attributeType(schema)).toBe('other type')
	})

	it('returns undefined when there is no type or enum field', () => {
		const schema = {}
		expect(attributeType(schema)).toBe('undefined')
	})
})

describe('buildTableOutput', () => {
	const pushMock = jest.fn()
	const toStringMock = jest.fn()
	const table: Table = { push: pushMock, toString: toStringMock }
	const newOutputTableMock = jest.fn().mockReturnValue(table)
	const tableGenerator = {
		newOutputTable: newOutputTableMock,
	} as unknown as TableGenerator

	const attributeTypeSpy = jest.spyOn(capabilitiesUtil, 'attributeType')

	const baseCapability = { id: 'capability-id', name: 'Name' }

	it('starts with name and id', () => {
		const result = buildTableOutput(tableGenerator, baseCapability)

		expect(result).toStartWith('Capability: Name (capability-id)\n')
		expect(newOutputTableMock).toHaveBeenCalledTimes(0)
	})

	it('ends with summarized text', () => {
		const result = buildTableOutput(tableGenerator, baseCapability)

		expect(result).toEndWith(`\n\n${summarizedText}`)
		expect(newOutputTableMock).toHaveBeenCalledTimes(0)
	})

	it('skips attributes and commands entirely when not included', () => {
		const result = buildTableOutput(tableGenerator, baseCapability)

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

		const result = buildTableOutput(tableGenerator, capability)

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

		attributeTypeSpy.mockReturnValueOnce('attr1 display type')
		attributeTypeSpy.mockReturnValueOnce('attr2 display type')
		toStringMock.mockReturnValueOnce('attribute table')

		const result = buildTableOutput(tableGenerator, capability)

		expect(result).toContain('\n\nAttributes: \nattribute table')
		expect(result).not.toContain('Commands')

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(attributeTypeSpy).toHaveBeenCalledTimes(2)
		expect(attributeTypeSpy).toHaveBeenCalledWith(attr1Schema.properties.value)
		expect(attributeTypeSpy).toHaveBeenCalledWith(attr2Schema.properties.value)
		expect(pushMock).toHaveBeenCalledTimes(2)
		expect(pushMock).toHaveBeenCalledWith(['attr1', 'attr1 display type', 'setAttr1'])
		expect(pushMock).toHaveBeenCalledWith(['attr2', 'attr2 display type', ''])
		expect(toStringMock).toHaveBeenCalledTimes(1)
		expect(toStringMock).toHaveBeenCalledWith()
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

		toStringMock.mockReturnValueOnce('command table')

		const result = buildTableOutput(tableGenerator, capability)

		expect(result).toContain('\n\nCommands: \ncommand table')
		expect(result).not.toContain('Attributes')

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(attributeTypeSpy).toHaveBeenCalledTimes(0)
		expect(pushMock).toHaveBeenCalledTimes(2)
		expect(pushMock).toHaveBeenCalledWith(['command1', ''])
		expect(pushMock).toHaveBeenCalledWith(['command2', ''])
		expect(toStringMock).toHaveBeenCalledTimes(1)
		expect(toStringMock).toHaveBeenCalledWith()
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

		attributeTypeSpy.mockReturnValueOnce('arg 1 display type')
		toStringMock.mockReturnValueOnce('command table')

		const result = buildTableOutput(tableGenerator, capability)

		expect(result).toContain('\n\nCommands: \ncommand table')
		expect(result).not.toContain('Attributes')

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(attributeTypeSpy).toHaveBeenCalledTimes(1)
		expect(attributeTypeSpy).toHaveBeenCalledWith(command.arguments[0].schema)
		expect(pushMock).toHaveBeenCalledTimes(1)
		expect(pushMock).toHaveBeenCalledWith(['command', 'value: arg 1 display type (optional)'])
		expect(toStringMock).toHaveBeenCalledTimes(1)
		expect(toStringMock).toHaveBeenCalledWith()
	})

	it('displays required arguments using `attributeType`', () => {
		const command = {
			name: 'setString',
			arguments: [{ name: 'value', schema: { type: 'string' } }],
		}
		const capability = {
			...baseCapability,
			commands: { command },
		}

		attributeTypeSpy.mockReturnValueOnce('arg 1 display type')
		toStringMock.mockReturnValueOnce('command table')

		const result = buildTableOutput(tableGenerator, capability)

		expect(result).toContain('\n\nCommands: \ncommand table')
		expect(result).not.toContain('Attributes')

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(attributeTypeSpy).toHaveBeenCalledTimes(1)
		expect(attributeTypeSpy).toHaveBeenCalledWith(command.arguments[0].schema)
		expect(pushMock).toHaveBeenCalledTimes(1)
		expect(pushMock).toHaveBeenCalledWith(['command', 'value: arg 1 display type'])
		expect(toStringMock).toHaveBeenCalledTimes(1)
		expect(toStringMock).toHaveBeenCalledWith()
	})
})

const listNamespacesMock = jest.fn()
const listMock = jest.fn()
const listStandardMock = jest.fn()
const client = { capabilities: {
	listNamespaces: listNamespacesMock,
	list: listMock,
	listStandard: listStandardMock,
} } as unknown as SmartThingsClient

const ns1Capabilities = [{ id: 'capability-1', version: 1 }, { id: 'capability-2', version: 1 }]
const ns2Capabilities = [{ id: 'capability-3', version: 1 }]
const customCapabilitiesWithNamespaces = [
	{ id: 'capability-1', version: 1, namespace: 'namespace-1' },
	{ id: 'capability-2', version: 1, namespace: 'namespace-1' },
	{ id: 'capability-3', version: 1, namespace: 'namespace-2' },
]

const standardCapabilities = [
	{ id: 'switch', version: 1 },
	{ id: 'button', version: 1 },
	{ id: 'bridge', version: 1, status: 'deprecated' },
]
const switchCapability = { id: 'switch', version: 1, namespace: 'st' }
const buttonCapability = { id: 'button', version: 1, namespace: 'st' }
const bridgeCapability = { id: 'bridge', version: 1, status: 'deprecated', namespace: 'st' }
const standardCapabilitiesWithNamespaces = [switchCapability, buttonCapability, bridgeCapability]
const allCapabilitiesWithNamespaces = [...standardCapabilitiesWithNamespaces, ...customCapabilitiesWithNamespaces]

describe('getCustomByNamespace', () => {
	it('lists for specified namespace', async () => {
		const summaries = [{ id: 'capability-1', version: 1 }]
		listMock.mockResolvedValueOnce(summaries)

		expect(await getCustomByNamespace(client, 'specific-namespace'))
			.toStrictEqual([{ id: 'capability-1', version: 1, namespace: 'specific-namespace' }])

		expect(listNamespacesMock).toHaveBeenCalledTimes(0)
		expect(listMock).toHaveBeenCalledTimes(1)
		expect(listMock).toHaveBeenCalledWith('specific-namespace')
	})

	it('combines from all namespaces', async () => {
		listNamespacesMock.mockResolvedValueOnce([{ name: 'namespace-1' }, { name: 'namespace-2' }])
		listMock.mockResolvedValueOnce(ns1Capabilities)
		listMock.mockResolvedValueOnce(ns2Capabilities)

		expect(await getCustomByNamespace(client)).toStrictEqual(customCapabilitiesWithNamespaces)

		expect(listNamespacesMock).toHaveBeenCalledTimes(1)
		expect(listMock).toHaveBeenCalledTimes(2)
		expect(listMock).toHaveBeenCalledWith('namespace-1')
		expect(listMock).toHaveBeenCalledWith('namespace-2')
	})
})

describe('getStandard', () => {
	it('returns standard capabilities with the "st" namespace', async () => {
		listStandardMock.mockResolvedValueOnce(standardCapabilities)
		expect(await getStandard(client)).toStrictEqual(standardCapabilitiesWithNamespaces)
	})
})

describe('getAllFiltered', () => {
	const getStandardSpy = jest.spyOn(capabilitiesUtil, 'getStandard')
	const getCustomByNamespaceSpy = jest.spyOn(capabilitiesUtil, 'getCustomByNamespace')

	it('skips filter when empty', async () => {
		getStandardSpy.mockResolvedValueOnce(standardCapabilitiesWithNamespaces)
		getCustomByNamespaceSpy.mockResolvedValueOnce(customCapabilitiesWithNamespaces)

		expect(await getAllFiltered({} as SmartThingsClient, ''))
			.toStrictEqual(allCapabilitiesWithNamespaces)
	})

	it('filters out items by name', async () => {
		getStandardSpy.mockResolvedValueOnce(standardCapabilitiesWithNamespaces)
		getCustomByNamespaceSpy.mockResolvedValueOnce(customCapabilitiesWithNamespaces)

		expect(await getAllFiltered({} as SmartThingsClient, 'switch'))
			.toStrictEqual([switchCapability])
	})

	it('filters out deprecated items', async () => {
		getStandardSpy.mockResolvedValueOnce(standardCapabilitiesWithNamespaces)
		getCustomByNamespaceSpy.mockResolvedValueOnce(customCapabilitiesWithNamespaces)

		expect(await getAllFiltered({} as SmartThingsClient, 'b'))
			.toStrictEqual([buttonCapability, ...customCapabilitiesWithNamespaces])
	})
})

describe('convertToId', () => {
	it('returns false for empty string', () => {
		expect(convertToId('', allCapabilitiesWithNamespaces)).toBeFalse()
	})

	it('returns id if item found', () => {
		expect(convertToId('button', allCapabilitiesWithNamespaces)).toBe('button')
	})

	it('returns false if item not found', () => {
		expect(convertToId('bad-capability-id', allCapabilitiesWithNamespaces)).toBeFalse()
	})

	it('returns id looked up by index for integer in range', () => {
		expect(convertToId('5', allCapabilitiesWithNamespaces)).toBe('capability-2')
	})

	it('returns false for index that is out of range', () => {
		expect(convertToId('0', allCapabilitiesWithNamespaces)).toBeFalse()
		expect(convertToId('7', allCapabilitiesWithNamespaces)).toBeFalse()
	})

	it('throws exception if type of id is not a string', () => {
		expect(() => convertToId('1', [{ id: 1993 } as unknown as CapabilitySummaryWithNamespace])).toThrow()
	})
})

describe('getIdFromUser', () => {
	const promptMock = jest.mocked(inquirer.prompt)
	const convertToIdSpy = jest.spyOn(capabilitiesUtil, 'convertToId')
	const fieldInfo = {} as Sorting

	it('returns selected id with version', async () => {
		promptMock.mockResolvedValueOnce({ idOrIndex: 'chosen-id' })
		convertToIdSpy.mockReturnValueOnce('converted-chosen-id')

		expect(await getIdFromUser(fieldInfo, allCapabilitiesWithNamespaces))
			.toStrictEqual({ id: 'converted-chosen-id', version: 1 })

		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'input', message: 'Enter id or index' }))
		expect(convertToIdSpy).toHaveBeenCalledTimes(1)
		expect(convertToIdSpy).toHaveBeenCalledWith('chosen-id', allCapabilitiesWithNamespaces)
	})

	it('passes prompt message to inquirer', async () => {
		promptMock.mockResolvedValueOnce({ idOrIndex: 'chosen-id' })
		convertToIdSpy.mockReturnValueOnce('converted-chosen-id')

		expect(await getIdFromUser(fieldInfo, allCapabilitiesWithNamespaces, 'user prompt'))
			.toStrictEqual({ id: 'converted-chosen-id', version: 1 })

		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'input', message: 'user prompt' }))
		expect(convertToIdSpy).toHaveBeenCalledTimes(1)
		expect(convertToIdSpy).toHaveBeenCalledWith('chosen-id', allCapabilitiesWithNamespaces)
	})

	it('throws error when convertToId fails', async () => {
		promptMock.mockResolvedValueOnce({ idOrIndex: 'invalid' })
		convertToIdSpy.mockReturnValueOnce(false)

		await expect(getIdFromUser(fieldInfo, allCapabilitiesWithNamespaces))
			.rejects.toThrow()

		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'input', message: 'Enter id or index' }))
		expect(convertToIdSpy).toHaveBeenCalledTimes(1)
		expect(convertToIdSpy).toHaveBeenCalledWith('invalid', allCapabilitiesWithNamespaces)
	})

	describe('validation function', () => {
		it('returns true when convertToId returns truthy', async () => {
			promptMock.mockResolvedValueOnce({ idOrIndex: 'chosen-id' })
			convertToIdSpy.mockReturnValueOnce('converted-chosen-id')

			expect(await getIdFromUser(fieldInfo, allCapabilitiesWithNamespaces, 'user prompt'))
				.toStrictEqual({ id: 'converted-chosen-id', version: 1 })

			const validateFunction = (promptMock.mock.calls[0][0] as { validate: (input: string) => true | string }).validate

			convertToIdSpy.mockReset() // reset to clear calls made getting the function above
			convertToIdSpy.mockReturnValueOnce('truthy-value')
			expect(validateFunction('user-input')).toBe(true)
			expect(convertToIdSpy).toHaveBeenCalledTimes(1)
			expect(convertToIdSpy).toHaveBeenCalledWith('user-input', allCapabilitiesWithNamespaces)
		})

		it('returns error string when convertToId returns false', async () => {
			promptMock.mockResolvedValueOnce({ idOrIndex: 'chosen-id' })
			convertToIdSpy.mockReturnValueOnce('converted-chosen-id')

			expect(await getIdFromUser(fieldInfo, allCapabilitiesWithNamespaces, 'user prompt'))
				.toStrictEqual({ id: 'converted-chosen-id', version: 1 })

			const validateFunction = (promptMock.mock.calls[0][0] as { validate: (input: string) => true | string }).validate

			convertToIdSpy.mockReset() // reset to clear calls made getting the function above
			convertToIdSpy.mockReturnValueOnce(false)
			expect(validateFunction('user-input')).toBe('Invalid id or index user-input. Please enter an index or valid id.')
			expect(convertToIdSpy).toHaveBeenCalledTimes(1)
			expect(convertToIdSpy).toHaveBeenCalledWith('user-input', allCapabilitiesWithNamespaces)
		})
	})
})

describe('translateToId', () => {
	const listMock = jest.fn().mockResolvedValue(allCapabilitiesWithNamespaces)
	it('returns input if it is a `CapabilityId`', async () => {
		const capabilityId = { id: 'capability-id', version: 1 }

		expect(await translateToId('', capabilityId, listMock)).toBe(capabilityId)

		expect(listMock).toHaveBeenCalledTimes(0)
	})

	it('returns `CapabilityId` with input as id if input is a string', async () => {
		const capabilityId = { id: 'capability-id', version: 1 }

		expect(await translateToId('', capabilityId.id, listMock)).toStrictEqual(capabilityId)

		expect(listMock).toHaveBeenCalledTimes(0)
	})

	it('returns id when input is integer (index) and is in range', async () => {
		expect(await translateToId('', '2', listMock)).toStrictEqual({ id: 'button', version: 1 })

		expect(listMock).toHaveBeenCalledTimes(1)
		expect(listMock).toHaveBeenCalledWith()
	})

	it('throws error is out-of-range integer', async () => {
		await expect(translateToId('', '0', listMock)).rejects.toThrow()
		await expect(translateToId('', '7', listMock)).rejects.toThrow()
	})
})

const selectedCapabilityId = { id: 'selected-capability-id', version: 1 }
const selectFromListMock = jest.mocked(selectFromList).mockResolvedValue(selectedCapabilityId)

const command = { client } as APIOrganizationCommand<typeof APIOrganizationCommand.flags>

describe('chooseCapability', () => {
	it('uses id from args when specified', async () => {
		expect(await chooseCapability(command, 'id-from-args')).toBe(selectedCapabilityId)

		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({ itemName: 'capability' }),
			expect.objectContaining({
				preselectedId: { id: 'id-from-args', version: 1 },
				getIdFromUser,
				promptMessage: undefined,
			}),
		)
	})

	it('uses id and version from args when specified', async () => {
		expect(await chooseCapability(command, 'id-from-args', 5)).toBe(selectedCapabilityId)

		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({ itemName: 'capability' }),
			expect.objectContaining({
				preselectedId: { id: 'id-from-args', version: 5 },
				getIdFromUser,
				promptMessage: undefined,
			}),
		)
	})

	it('prompts user when no id from args', async () => {
		expect(await chooseCapability(command)).toBe(selectedCapabilityId)

		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({ itemName: 'capability' }),
			expect.objectContaining({
				preselectedId: undefined,
				getIdFromUser,
				promptMessage: undefined,
			}),
		)
	})

	it('passes on promptMessage', async () => {
		expect(await chooseCapability(command, undefined, undefined, 'user prompt')).toBe(selectedCapabilityId)

		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({ itemName: 'capability' }),
			expect.objectContaining({
				preselectedId: undefined,
				getIdFromUser,
				promptMessage: 'user prompt',
			}),
		)
	})

	it('uses list function that returns custom capabilities', async () => {
		expect(await chooseCapability(command)).toBe(selectedCapabilityId)

		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({ itemName: 'capability' }),
			expect.objectContaining({ preselectedId: undefined }),
		)

		const getCustomByNamespaceSpy = jest.spyOn(capabilitiesUtil, 'getCustomByNamespace')
			.mockResolvedValueOnce(customCapabilitiesWithNamespaces)
		const listItems = selectFromListMock.mock.calls[0][2].listItems

		expect(await listItems()).toBe(customCapabilitiesWithNamespaces)

		expect(getCustomByNamespaceSpy).toHaveBeenCalledTimes(1)
		expect(getCustomByNamespaceSpy).toHaveBeenCalledWith(client)
	})
})

describe('chooseCapabilityFiltered', () => {
	it('uses selectFromList', async () => {
		expect(await chooseCapabilityFiltered(command, 'user prompt', 'filter')).toBe(selectedCapabilityId)

		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({ itemName: 'capability' }),
			expect.objectContaining({
				getIdFromUser,
				promptMessage: 'user prompt',
			}),
		)
	})

	it('uses list function that uses getAllFiltered', async () => {
		expect(await chooseCapabilityFiltered(command, 'user prompt', 'filter')).toBe(selectedCapabilityId)

		expect(selectFromListMock).toHaveBeenCalledTimes(1)

		const listItems = selectFromListMock.mock.calls[0][2].listItems
		const getAllFilteredSpy = jest.spyOn(capabilitiesUtil, 'getAllFiltered')
			.mockResolvedValueOnce(customCapabilitiesWithNamespaces)

		expect(await listItems()).toBe(customCapabilitiesWithNamespaces)

		expect(getAllFilteredSpy).toHaveBeenCalledTimes(1)
		expect(getAllFilteredSpy).toHaveBeenCalledWith(client, 'filter')
	})
})
