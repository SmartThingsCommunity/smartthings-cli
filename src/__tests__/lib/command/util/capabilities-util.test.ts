import { jest } from '@jest/globals'

import type {
	CapabilitiesEndpoint,
	CapabilityNamespace,
	CapabilityJSONSchema,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import type { asTextBulletedList, fatalError } from '../../../../lib/util.js'
import type { ListDataFunction } from '../../../../lib/command/io-defs.js'
import type { sort } from '../../../../lib/command/output.js'
import type { CapabilitySummaryWithNamespace } from '../../../../lib/command/util/capabilities-util.js'


const asTextBulletedListMock = jest.fn<typeof asTextBulletedList>()
const fatalErrorMock = jest.fn<typeof fatalError>()
jest.unstable_mockModule('../../../../lib/util.js', () => ({
	asTextBulletedList: asTextBulletedListMock,
	fatalError: fatalErrorMock,
}))

const sortMock = jest.fn<typeof sort>()
jest.unstable_mockModule('../../../../lib/command/output.js', () => ({
	sort: sortMock,
}))


const {
	attributeTypeDisplayString,
	convertToId,
	getCustomByNamespace,
	getStandard,
	translateToId,
} = await import('../../../../lib/command/util/capabilities-util.js')


describe('attributeTypeDisplayString', () => {
	it('lists types of tuple-style array', () => {
		const items: CapabilityJSONSchema[] = [{ type: 'string' }, { type: 'number' }]
		const schema: CapabilityJSONSchema = { type: 'array', items }
		expect(attributeTypeDisplayString(schema)).toBe('array[string, number]')
	})

	it('for array, uses "enum" when no type specified but enum field exists', () => {
		const items: CapabilityJSONSchema[] = [{ type: 'string' }, { enum: ['option 1', 'option 2'] }]
		const schema: CapabilityJSONSchema = { type: 'array', items }
		expect(attributeTypeDisplayString(schema)).toBe('array[string, enum]')
	})

	it('for array, uses "unknown" when no type or enum field exists', () => {
		const items: CapabilityJSONSchema[] = [{ type: 'string' }, { title: 'not typed' }]
		const schema: CapabilityJSONSchema = { type: 'array', items }
		expect(attributeTypeDisplayString(schema)).toBe('array[string, unknown]')
	})

	it('includes type of array with type', () => {
		const schema = { type: 'array', items: { type: 'string' } }
		expect(attributeTypeDisplayString(schema)).toBe('array<string>')
	})

	it('returns "array" for array with no type(s) specified', () => {
		const schema = { type: 'array' }
		expect(attributeTypeDisplayString(schema)).toBe('array')
	})

	it('returns object as properties list surrounded by {}', () => {
		const schema = {
			type: 'object',
			properties: { prop1: { type: 'string' }, prop2: { title: 'untyped' } },
		}
		expect(attributeTypeDisplayString(schema)).toBe('{\n  prop1: string\n  prop2: undefined\n}')
	})

	it('for object, uses "title" when no properties provided', () => {
		const schema = { type: 'object', title: 'obj title' }
		expect(attributeTypeDisplayString(schema)).toBe('obj title')
	})

	it('for object, uses "object" when no properties or title provided', () => {
		const schema = { type: 'object' }
		expect(attributeTypeDisplayString(schema)).toBe('object')
	})

	it('for object, uses asTextBulletedList for enum', () => {
		asTextBulletedListMock.mockReturnValueOnce(':joined enums')
		const schema = { enum: ['option 1', 'option 2'] }

		expect(attributeTypeDisplayString(schema)).toBe('enum:joined enums')

		expect(asTextBulletedListMock).toHaveBeenCalledTimes(1)
		expect(asTextBulletedListMock).toHaveBeenCalledWith(schema.enum)
	})

	it('uses type name for types not specifically handled', () => {
		const schema = { type: 'other type' }
		expect(attributeTypeDisplayString(schema)).toBe('other type')
	})

	it('returns undefined when there is no type or enum field', () => {
		const schema = {}
		expect(attributeTypeDisplayString(schema)).toBe('undefined')
	})
})

const apiCapabilitiesListNamespacesMock =
	jest.fn<typeof CapabilitiesEndpoint.prototype.listNamespaces>()
const apiCapabilitiesListMock = jest.fn<typeof CapabilitiesEndpoint.prototype.list>()
const apiCapabilitiesListStandardMock =
	jest.fn<typeof CapabilitiesEndpoint.prototype.listStandard>()
const client = { capabilities: {
	listNamespaces: apiCapabilitiesListNamespacesMock,
	list: apiCapabilitiesListMock,
	listStandard: apiCapabilitiesListStandardMock,
} } as unknown as SmartThingsClient

const ns1Capabilities = [{ id: 'capability-1', version: 1 }, { id: 'capability-2', version: 1 }]
const ns2Capabilities = [{ id: 'capability-3', version: 1 }]

const customCapabilitiesWithNamespaces = [
	{ id: 'capability-1', version: 1, namespace: 'namespace-1' },
	{ id: 'capability-2', version: 1, namespace: 'namespace-1' },
	{ id: 'capability-3', version: 1, namespace: 'namespace-2' },
]
const switchCapability = { id: 'switch', version: 1, namespace: 'st' }
const buttonCapability = { id: 'button', version: 1, namespace: 'st' }
const bridgeCapability = { id: 'bridge', version: 1, status: 'deprecated', namespace: 'st' }
const standardCapabilitiesWithNamespaces = [switchCapability, buttonCapability, bridgeCapability]
const allCapabilitiesWithNamespaces = [...standardCapabilitiesWithNamespaces, ...customCapabilitiesWithNamespaces]
const sortedCapabilitiesWithNamespaces = [...customCapabilitiesWithNamespaces, ...standardCapabilitiesWithNamespaces]


describe('getCustomByNamespace', () => {
	it('lists for specified namespace', async () => {
		const summaries = [{ id: 'capability-1', version: 1 }]
		apiCapabilitiesListMock.mockResolvedValueOnce(summaries)

		expect(await getCustomByNamespace(client, 'specific-namespace'))
			.toStrictEqual([{ id: 'capability-1', version: 1, namespace: 'specific-namespace' }])

		expect(apiCapabilitiesListNamespacesMock).toHaveBeenCalledTimes(0)
		expect(apiCapabilitiesListMock).toHaveBeenCalledTimes(1)
		expect(apiCapabilitiesListMock).toHaveBeenCalledWith('specific-namespace')
	})

	it('combines from all namespaces', async () => {
		apiCapabilitiesListNamespacesMock.mockResolvedValueOnce(
			[{ name: 'namespace-1' }, { name: 'namespace-2' }] as CapabilityNamespace[],
		)
		apiCapabilitiesListMock.mockResolvedValueOnce(ns1Capabilities)
		apiCapabilitiesListMock.mockResolvedValueOnce(ns2Capabilities)

		expect(await getCustomByNamespace(client)).toStrictEqual(customCapabilitiesWithNamespaces)

		expect(apiCapabilitiesListNamespacesMock).toHaveBeenCalledTimes(1)
		expect(apiCapabilitiesListMock).toHaveBeenCalledTimes(2)
		expect(apiCapabilitiesListMock).toHaveBeenCalledWith('namespace-1')
		expect(apiCapabilitiesListMock).toHaveBeenCalledWith('namespace-2')
	})
})

describe('getStandard', () => {
	const standardCapabilities = [
		{ id: 'switch', version: 1 },
		{ id: 'button', version: 1 },
		{ id: 'bridge', version: 1, status: 'deprecated' },
	]

	it('returns standard capabilities with the "st" namespace', async () => {
		apiCapabilitiesListStandardMock.mockResolvedValueOnce(standardCapabilities)
		expect(await getStandard(client)).toStrictEqual(standardCapabilitiesWithNamespaces)
	})
})

describe('translateToId', () => {
	const listFunctionMock = jest.fn<ListDataFunction<CapabilitySummaryWithNamespace>>()
		.mockResolvedValue(allCapabilitiesWithNamespaces)
	sortMock.mockReturnValue(sortedCapabilitiesWithNamespaces)

	it('returns input if it is a `CapabilityId`', async () => {
		const capabilityId = { id: 'capability-id', version: 1 }

		expect(await translateToId('id', capabilityId, listFunctionMock)).toBe(capabilityId)

		expect(apiCapabilitiesListMock).not.toHaveBeenCalled()
		expect(sortMock).not.toHaveBeenCalled()
	})

	it('returns undefined if input is undefined', async () => {
		expect(await translateToId('id', undefined, listFunctionMock)).toBe(undefined)

		expect(apiCapabilitiesListMock).not.toHaveBeenCalled()
		expect(sortMock).not.toHaveBeenCalled()
	})

	it('returns `CapabilityId` with input as id if input is a string', async () => {
		const capabilityId = { id: 'capability-id', version: 1 }

		expect(await translateToId('id', capabilityId.id, listFunctionMock)).toStrictEqual(capabilityId)

		expect(apiCapabilitiesListMock).not.toHaveBeenCalled()
		expect(sortMock).not.toHaveBeenCalled()
	})

	it('returns id when input is integer (index) and is in range', async () => {
		expect(await translateToId('id', '5', listFunctionMock)).toStrictEqual({ id: 'button', version: 1 })

		expect(listFunctionMock).toHaveBeenCalledExactlyOnceWith()
		expect(sortMock).toHaveBeenCalledExactlyOnceWith(allCapabilitiesWithNamespaces, 'id')
	})

	it('fails with fatal error for out-of-range integer', async () => {
		fatalErrorMock.mockImplementation(() => {
			// simulate not returning by throwing an error
			throw Error('fatal error')
		})

		await expect(translateToId('id', '0', listFunctionMock)).rejects.toThrow()
		await expect(translateToId('id', '7', listFunctionMock)).rejects.toThrow()

		expect(fatalErrorMock).toHaveBeenCalledTimes(2)
		expect(fatalErrorMock).toHaveBeenCalledWith(expect.stringContaining('invalid index 0'))
		expect(fatalErrorMock).toHaveBeenCalledWith(expect.stringContaining('invalid index 7'))
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
