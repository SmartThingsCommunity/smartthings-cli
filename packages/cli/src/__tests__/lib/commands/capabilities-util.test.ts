import inquirer from 'inquirer'

import { SmartThingsClient } from '@smartthings/core-sdk'

import { APIOrganizationCommand, selectFromList, Sorting, Table, TableGenerator } from '@smartthings/cli-lib'

import {
	CapabilitySummaryWithNamespace,
	chooseCapability,
	chooseCapabilityFiltered,
	convertToId,
	getAllFiltered,
	getCustomByNamespace,
	getIdFromUser,
	getStandard,
} from '../../../lib/commands/capabilities-util.js'
import * as capabilitiesUtil from '../../../lib/commands/capabilities-util.js'


jest.mock('inquirer')

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
	const fieldInfo = {} as Sorting<CapabilitySummaryWithNamespace>

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

	it('passes on namespace', async () => {
		expect(await chooseCapability(command, undefined, undefined, undefined, 'namespace')).toBe(selectedCapabilityId)

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

		const getCustomByNamespaceSpy = jest.spyOn(capabilitiesUtil, 'getCustomByNamespace')
			.mockResolvedValueOnce(customCapabilitiesWithNamespaces)
		const listItems = selectFromListMock.mock.calls[0][2].listItems

		expect(await listItems()).toBe(customCapabilitiesWithNamespaces)

		expect(getCustomByNamespaceSpy).toHaveBeenCalledTimes(1)
		expect(getCustomByNamespaceSpy).toHaveBeenCalledWith(client, 'namespace')
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
		expect(getCustomByNamespaceSpy).toHaveBeenCalledWith(client, undefined)
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
