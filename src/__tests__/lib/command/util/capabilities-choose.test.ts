import { jest } from '@jest/globals'

import type inquirer from 'inquirer'

import { CapabilitiesEndpoint, type SmartThingsClient } from '@smartthings/core-sdk'

import type { APICommand } from '../../../../lib/command/api-command.js'
import type { selectFromList, SelectFromListFlags } from '../../../../lib/command/select.js'
import type {
	CapabilitySummaryWithNamespace,
	convertToId,
	getAllFiltered,
	getCustomByNamespace,
	translateToId,
} from '../../../../lib/command/util/capabilities-util.js'
import type { Sorting } from '../../../../lib/command/io-defs.js'


const promptMock = jest.fn<typeof inquirer.prompt>()
jest.unstable_mockModule('inquirer', () => ({
	default: {
		prompt: promptMock,
	},
}))

const selectFromListMock = jest.fn<typeof selectFromList>()
jest.unstable_mockModule('../../../../lib/command/select.js', () => ({
	selectFromList: selectFromListMock,
}))

const convertToIdMock = jest.fn<typeof convertToId>()
const getAllFilteredMock = jest.fn<typeof getAllFiltered>()
const getCustomByNamespaceMock = jest.fn<typeof getCustomByNamespace>()
const translateToIdMock = jest.fn<typeof translateToId>()
jest.unstable_mockModule('../../../../lib/command/util/capabilities-util.js', () => ({
	convertToId: convertToIdMock,
	getAllFiltered: getAllFilteredMock,
	getCustomByNamespace: getCustomByNamespaceMock,
	translateToId: translateToIdMock,
}))


const {
	chooseCapability,
	chooseCapabilityFiltered,
	getIdFromUser,
} = await import('../../../../lib/command/util/capabilities-choose.js')


const capabilities = [
	{ id: 'capability-1', version: 1, namespace: 'namespace-1' },
	{ id: 'capability-2', version: 1, namespace: 'namespace-1' },
]

describe('getIdFromUser', () => {
	const fieldInfo = {} as Sorting<CapabilitySummaryWithNamespace>

	it('returns selected id with version', async () => {
		promptMock.mockResolvedValueOnce({ idOrIndex: 'chosen-id' })
		convertToIdMock.mockReturnValueOnce('converted-chosen-id')

		expect(await getIdFromUser(fieldInfo, capabilities))
			.toStrictEqual({ id: 'converted-chosen-id', version: 1 })

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ type: 'input', message: 'Enter id or index' }),
		)
		expect(convertToIdMock).toHaveBeenCalledExactlyOnceWith('chosen-id', capabilities)
	})

	it('passes prompt message to inquirer', async () => {
		promptMock.mockResolvedValueOnce({ idOrIndex: 'chosen-id' })
		convertToIdMock.mockReturnValueOnce('converted-chosen-id')

		expect(await getIdFromUser(fieldInfo, capabilities, 'user prompt'))
			.toStrictEqual({ id: 'converted-chosen-id', version: 1 })

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ type: 'input', message: 'user prompt' }),
		)
		expect(convertToIdMock).toHaveBeenCalledExactlyOnceWith('chosen-id', capabilities)
	})

	it('throws error when convertToId fails', async () => {
		promptMock.mockResolvedValueOnce({ idOrIndex: 'invalid' })
		convertToIdMock.mockReturnValueOnce(false)

		await expect(getIdFromUser(fieldInfo, capabilities))
			.rejects.toThrow()

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ type: 'input', message: 'Enter id or index' }),
		)
		expect(convertToIdMock).toHaveBeenCalledExactlyOnceWith('invalid', capabilities)
	})

	describe('validation function', () => {
		it('returns true when convertToId returns truthy', async () => {
			promptMock.mockResolvedValueOnce({ idOrIndex: 'chosen-id' })
			convertToIdMock.mockReturnValueOnce('converted-chosen-id')

			expect(await getIdFromUser(fieldInfo, capabilities, 'user prompt'))
				.toStrictEqual({ id: 'converted-chosen-id', version: 1 })

			const validateFunction = (promptMock.mock.calls[0][0] as
				{ validate: (input: string) => true | string }).validate

			convertToIdMock.mockReset() // reset to clear calls made getting the function above
			convertToIdMock.mockReturnValueOnce('truthy-value')
			expect(validateFunction('user-input')).toBe(true)
			expect(convertToIdMock).toHaveBeenCalledExactlyOnceWith('user-input', capabilities)
		})

		it('returns error string when convertToId returns false', async () => {
			promptMock.mockResolvedValueOnce({ idOrIndex: 'chosen-id' })
			convertToIdMock.mockReturnValueOnce('converted-chosen-id')

			expect(await getIdFromUser(fieldInfo, capabilities, 'user prompt'))
				.toStrictEqual({ id: 'converted-chosen-id', version: 1 })

			const validateFunction = (promptMock.mock.calls[0][0] as
				{ validate: (input: string) => true | string }).validate

			convertToIdMock.mockReset() // reset to clear calls made getting the function above
			convertToIdMock.mockReturnValueOnce(false)
			expect(validateFunction('user-input'))
				.toBe('Invalid id or index user-input. Please enter an index or valid id.')
			expect(convertToIdMock).toHaveBeenCalledExactlyOnceWith('user-input', capabilities)
		})
	})
})

const selectedCapabilityId = { id: 'selected-capability-id', version: 1 }
selectFromListMock.mockResolvedValue(selectedCapabilityId)

const apiCapabilitiesListLocalesMock = jest.fn<typeof CapabilitiesEndpoint.prototype.listLocales>()
const client = {
	capabilities: {
		listLocales: apiCapabilitiesListLocalesMock,
	},
} as unknown as SmartThingsClient
const command = { client } as APICommand<SelectFromListFlags>

describe('chooseCapability', () => {
	it('uses id from args when specified', async () => {
		expect(await chooseCapability(command, 'id-from-args')).toBe(selectedCapabilityId)

		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ itemName: 'capability' }),
			expect.objectContaining({
				preselectedId: { id: 'id-from-args', version: 1 },
				getIdFromUser,
				promptMessage: undefined,
			}),
		)
		expect(translateToIdMock).not.toHaveBeenCalled()
	})

	it('translates id from index if `allowIndex` is specified', async () => {
		translateToIdMock.mockResolvedValueOnce({ id: 'translated-id', version: 13 })

		expect(await chooseCapability(command, '13', undefined, { allowIndex: true }))
			.toBe(selectedCapabilityId)

		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ itemName: 'capability' }),
			expect.objectContaining({
				preselectedId: { id: 'translated-id', version: 13 },
				getIdFromUser,
				promptMessage: undefined,
			}),
		)
		expect(translateToIdMock).toHaveBeenCalledExactlyOnceWith('id', '13', expect.any(Function))
	})

	it('uses id and version from args when specified', async () => {
		expect(await chooseCapability(command, 'id-from-args', 5)).toBe(selectedCapabilityId)

		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ itemName: 'capability' }),
			expect.objectContaining({
				preselectedId: { id: 'id-from-args', version: 5 },
				getIdFromUser,
				promptMessage: undefined,
			}),
		)
		expect(translateToIdMock).not.toHaveBeenCalled()
	})

	it('prompts user when no id from args', async () => {
		expect(await chooseCapability(command)).toBe(selectedCapabilityId)

		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ itemName: 'capability' }),
			expect.objectContaining({
				preselectedId: undefined,
				getIdFromUser,
				promptMessage: undefined,
			}),
		)
		expect(translateToIdMock).not.toHaveBeenCalled()
	})

	it('passes on promptMessage', async () => {
		expect(await chooseCapability(command, undefined, undefined, { promptMessage: 'user prompt' }))
			.toBe(selectedCapabilityId)

		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ itemName: 'capability' }),
			expect.objectContaining({
				preselectedId: undefined,
				getIdFromUser,
				promptMessage: 'user prompt',
			}),
		)
		expect(translateToIdMock).not.toHaveBeenCalled()
	})

	it('passes on namespace', async () => {
		expect(await chooseCapability(command, undefined, undefined, { namespace: 'namespace' }))
			.toBe(selectedCapabilityId)

		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ itemName: 'capability' }),
			expect.objectContaining({
				preselectedId: undefined,
				getIdFromUser,
				promptMessage: undefined,
			}),
		)
		expect(translateToIdMock).not.toHaveBeenCalled()

		getCustomByNamespaceMock.mockResolvedValueOnce(capabilities)
		const listItems = selectFromListMock.mock.calls[0][2].listItems

		expect(await listItems()).toBe(capabilities)

		expect(getCustomByNamespaceMock).toHaveBeenCalledExactlyOnceWith(client, 'namespace')
	})

	it('uses list function that returns custom capabilities', async () => {
		expect(await chooseCapability(command)).toBe(selectedCapabilityId)

		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ itemName: 'capability' }),
			expect.objectContaining({ preselectedId: undefined }),
		)
		expect(translateToIdMock).not.toHaveBeenCalled()

		getCustomByNamespaceMock.mockResolvedValueOnce(capabilities)
		const listItems = selectFromListMock.mock.calls[0][2].listItems

		expect(await listItems()).toBe(capabilities)

		expect(getCustomByNamespaceMock).toHaveBeenCalledExactlyOnceWith(client, undefined)
	})

	it('includes list of locales in verbose mode', async () => {
		expect(await chooseCapability(command, undefined, undefined, { verbose: true })).toBe(selectedCapabilityId)

		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ listTableFieldDefinitions: expect.arrayContaining(['locales']) }),
			expect.objectContaining({}),
		)

		getCustomByNamespaceMock.mockResolvedValueOnce(capabilities)
		const listItems = selectFromListMock.mock.calls[0][2].listItems
		apiCapabilitiesListLocalesMock.mockResolvedValueOnce([{ tag: 'es' }, { tag: 'en' }])
		apiCapabilitiesListLocalesMock.mockResolvedValueOnce([])
		const capabilitiesWithLocales = [
			{ ...capabilities[0], locales: 'en, es' },
			{ ...capabilities[1], locales: '' },
		]

		expect(await listItems()).toStrictEqual(capabilitiesWithLocales)

		expect(apiCapabilitiesListLocalesMock).toHaveBeenCalledTimes(2)
		expect(apiCapabilitiesListLocalesMock).toHaveBeenCalledWith('capability-1', 1)
		expect(apiCapabilitiesListLocalesMock).toHaveBeenCalledWith('capability-2', 1)
	})
})

describe('chooseCapabilityFiltered', () => {
	it('uses selectFromList', async () => {
		expect(await chooseCapabilityFiltered(command, 'user prompt', 'filter')).toBe(selectedCapabilityId)

		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ itemName: 'capability' }),
			expect.objectContaining({
				getIdFromUser,
				promptMessage: 'user prompt',
			}),
		)
	})

	it('uses list function that uses getAllFiltered', async () => {
		const customCapabilitiesWithNamespaces = [
			{ id: 'capability-1', version: 1, namespace: 'namespace-1' },
			{ id: 'capability-2', version: 1, namespace: 'namespace-1' },
			{ id: 'capability-3', version: 1, namespace: 'namespace-2' },
		]

		expect(await chooseCapabilityFiltered(command, 'user prompt', 'filter')).toBe(selectedCapabilityId)

		expect(selectFromListMock).toHaveBeenCalledTimes(1)

		const listItems = selectFromListMock.mock.calls[0][2].listItems
		getAllFilteredMock.mockResolvedValueOnce(customCapabilitiesWithNamespaces)

		expect(await listItems()).toBe(customCapabilitiesWithNamespaces)

		expect(getAllFilteredMock).toHaveBeenCalledExactlyOnceWith(client, 'filter')
	})
})
