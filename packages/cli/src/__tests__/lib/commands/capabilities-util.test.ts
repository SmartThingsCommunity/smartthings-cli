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
