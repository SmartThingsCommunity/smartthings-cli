import inquirer from 'inquirer'

import { DeviceActivity, HistoryEndpoint, PaginatedList, SmartThingsClient } from '@smartthings/core-sdk'

import { SmartThingsCommandInterface, Table, TableGenerator } from '@smartthings/cli-lib'

import {
	toEpochTime,
	sortEvents,
	getNextDeviceEvents,
	writeDeviceEventsTable,
	calculateRequestLimit,
	getHistory,
	maxItemsPerRequest,
	maxRequestsBeforeWarning,
} from '../../../lib/commands/history-util.js'


jest.mock('inquirer')

describe('toEpochTime', () => {
	it ('handles ISO input', () => {
		expect(toEpochTime('2022-08-01T22:41:42.559Z')).toBe(1659393702559)
	})

	it ('handles locale time input', () => {
		const expected = new Date('8/1/2022, 6:41:42 PM').getTime()
		expect(toEpochTime('8/1/2022, 6:41:42 PM')).toBe(expected)
	})

	it ('handles input in millis since epoch', () => {
		expect(toEpochTime('1700596752000')).toBe(1700596752000)
	})

	it('handles undefined input', () => {
		expect(toEpochTime(undefined)).toBeUndefined()
	})
})

describe('sortEvents', () => {
	it('sorts in reverse order', () => {
		const events = [
			{ epoch: 1659394186591 },
			{ epoch: 1659394186591 },
			{ epoch: 1659394186592 },
			{ epoch: 1659394186593 },
			{ epoch: 1659394186590 },
		] as DeviceActivity[]

		const result = sortEvents([...events])

		expect(result).toBeDefined()
		expect(result.length).toBe(5)
		expect(result[0]).toBe(events[3])
		expect(result[1]).toBe(events[2])
		expect(result[2]).toBe(events[0])
		expect(result[3]).toBe(events[1])
		expect(result[4]).toBe(events[4])
	})
})

describe('getNextDeviceEvents', () => {
	const tablePushMock: jest.Mock<number, [(string | undefined)[]]> = jest.fn()
	const tableToStringMock = jest.fn()
	const tableMock = {
		push: tablePushMock,
		toString: tableToStringMock,
	} as unknown as Table

	it('outputs local time and string values', () => {
		const time = new Date()
		const items = [
			{ time, component: 'main', capability: 'switch', attribute: 'switch', value: 'on' },
		] as unknown as DeviceActivity[]

		getNextDeviceEvents(tableMock, items, {})

		expect(tablePushMock).toHaveBeenCalledTimes(1)
		expect(tablePushMock).toHaveBeenCalledWith([
			time.toLocaleString(),
			'main',
			'switch',
			'switch',
			'"on"',
		])
		expect(tableToStringMock).toHaveBeenCalledTimes(0)
	})

	it('outputs UTC time and number value', () => {
		const time = new Date()
		const items = [
			{ time, component: 'main', capability: 'switchLevel', attribute: 'level', value: 80 },
		] as unknown as DeviceActivity[]

		getNextDeviceEvents(tableMock, items, { utcTimeFormat: true })

		expect(tablePushMock).toHaveBeenCalledTimes(1)
		expect(tablePushMock).toHaveBeenCalledWith([
			time.toISOString(),
			'main',
			'switchLevel',
			'level',
			'80',
		])
		expect(tableToStringMock).toHaveBeenCalledTimes(0)
	})

	it('outputs device name and number with units value', () => {
		const time = new Date()
		const items = [
			{ time, deviceName: 'Thermometer', component: 'main', capability: 'temperature', attribute: 'temp', value: 72, unit: 'F' },
		] as unknown as DeviceActivity[]

		getNextDeviceEvents(tableMock, items, { includeName: true })

		expect(tablePushMock).toHaveBeenCalledTimes(1)
		expect(tablePushMock).toHaveBeenCalledWith([
			time.toLocaleString(),
			'Thermometer',
			'main',
			'temperature',
			'temp',
			'72 F',
		])
		expect(tableToStringMock).toHaveBeenCalledTimes(0)
	})
})

describe('writeDeviceEventsTable', () => {
	const promptSpy = jest.spyOn(inquirer, 'prompt')
	const stdOutSpy = jest.spyOn(process.stdout, 'write')
	const tablePushMock: jest.Mock<number, [(string | undefined)[]]> = jest.fn()
	const tableToStringMock = jest.fn().mockReturnValue('table')
	const tableMock = {
		push: tablePushMock,
		toString: tableToStringMock,
	} as unknown as Table

	const newOutputTableMock = jest.fn().mockReturnValue(tableMock)

	const tableGeneratorMock: TableGenerator = {
		newOutputTable: newOutputTableMock,
		buildTableFromItem: jest.fn(),
		buildTableFromList: jest.fn(),
	} as TableGenerator

	const commandMock = {
		tableGenerator: tableGeneratorMock,
	} as SmartThingsCommandInterface

	const items = [
		{ time: new Date(), deviceName: 'Thermometer', component: 'main', capability: 'temperature', attribute: 'temp', value: 72, unit: 'F' },
	] as unknown as DeviceActivity[]

	const hasNext = jest.fn()
	const next = jest.fn()
	const dataMock = {
		items,
		hasNext,
		next,
	} as unknown as PaginatedList<DeviceActivity>

	it('omits the device name by default', async () => {
		hasNext.mockReturnValue(false)

		await writeDeviceEventsTable(commandMock, dataMock)

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(newOutputTableMock).toHaveBeenCalledWith({
			isList: true,
			head: ['Time', 'Component', 'Capability', 'Attribute', 'Value'],
		})
		expect(tablePushMock).toHaveBeenCalledTimes(1)
		expect(stdOutSpy).toHaveBeenCalledTimes(1)
	})

	it('includes the device name when specified', async () => {
		hasNext.mockReturnValue(false)

		await writeDeviceEventsTable(commandMock, dataMock, { includeName: true })

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(newOutputTableMock).toHaveBeenCalledWith({
			isList: true,
			head: ['Time', 'Device Name', 'Component', 'Capability', 'Attribute', 'Value'],
		})
		expect(tablePushMock).toHaveBeenCalledTimes(1)
		expect(stdOutSpy).toHaveBeenCalledTimes(1)
	})

	it('returns next page when prompted until no more', async () => {
		hasNext.mockReturnValueOnce(true)
		hasNext.mockReturnValueOnce(true)
		hasNext.mockReturnValueOnce(false)
		promptSpy.mockResolvedValueOnce({ more: true })
		promptSpy.mockResolvedValueOnce({ more: true })

		await writeDeviceEventsTable(commandMock, dataMock)

		expect(newOutputTableMock).toHaveBeenCalledTimes(3)
		expect(tablePushMock).toHaveBeenCalledTimes(3)
		expect(stdOutSpy).toHaveBeenCalledTimes(3)
	})

	it('returns next page until canceled', async () => {
		hasNext.mockReturnValue(true)
		promptSpy.mockResolvedValueOnce({ more: true })
		promptSpy.mockResolvedValueOnce({ more: false })

		await writeDeviceEventsTable(commandMock, dataMock)

		expect(newOutputTableMock).toHaveBeenCalledTimes(2)
		expect(tablePushMock).toHaveBeenCalledTimes(2)
		expect(stdOutSpy).toHaveBeenCalledTimes(2)
	})
})

describe('calculateHistoryRequestLimit', () => {
	it('returns limit if less than or equal to maxItemsPerRequest', () => {
		expect(calculateRequestLimit(20)).toBe(20)
		expect(calculateRequestLimit(300)).toBe(300)
		expect(calculateRequestLimit(301)).toBe(300)
		expect(calculateRequestLimit(500)).toBe(300)
	})
})

describe('getHistory', () => {
	const historyDevicesMock = jest.fn()
	const history = { devices: historyDevicesMock } as unknown as HistoryEndpoint
	const client = { history } as SmartThingsClient

	const hasNextMock = jest.fn().mockReturnValue(false)
	const nextMock = jest.fn().mockImplementation()

	const params = { locationId: 'location-id', deviceId: 'device-id' }
	const items: DeviceActivity[] = []
	const totalNumItems = maxItemsPerRequest * maxRequestsBeforeWarning + 10
	for (let index = 0; index < totalNumItems; index++) {
		items.push({
			deviceId: 'history-device-id',
			text: `item${index}`,
		} as DeviceActivity)
	}

	const promptMock = jest.mocked(inquirer.prompt)

	// Since the core SDK mutates this object via the `.next` call, each test needs its own instance.
	const makeHistoryResponse = (items: DeviceActivity[]): PaginatedList<DeviceActivity> => ({
		items,
		hasNext: hasNextMock,
		next: nextMock,
	} as unknown as PaginatedList<DeviceActivity>)

	it('uses single request when one is enough', async () => {
		const returnedItems = items.slice(0, 2)
		historyDevicesMock.mockResolvedValueOnce(makeHistoryResponse(returnedItems))

		expect(await getHistory(client, 20, 20, params)).toStrictEqual(returnedItems)

		expect(historyDevicesMock).toHaveBeenCalledTimes(1)
		expect(historyDevicesMock).toHaveBeenCalledWith(params)
		expect(hasNextMock).toHaveBeenCalledTimes(1)
		expect(nextMock).toHaveBeenCalledTimes(0)
		expect(promptMock).toHaveBeenCalledTimes(0)
	})

	it('makes multiple calls when needed', async () => {
		const firstItemSet = items.slice(0, 2)
		const secondItemSet = items.slice(2, 4)
		const allItems = items.slice(0, 4)
		const historyResponse = makeHistoryResponse(firstItemSet)
		historyDevicesMock.mockResolvedValueOnce(historyResponse)
		hasNextMock.mockReturnValueOnce(true)
		nextMock.mockImplementationOnce(async () => historyResponse.items = secondItemSet)

		expect(await getHistory(client, 20, 20, params)).toStrictEqual(allItems)

		expect(historyDevicesMock).toHaveBeenCalledTimes(1)
		expect(historyDevicesMock).toHaveBeenCalledWith(params)
		expect(hasNextMock).toHaveBeenCalledTimes(2)
		expect(nextMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledTimes(0)
	})

	it('abandons large query when requested to do so', async () => {
		promptMock.mockResolvedValueOnce({ answer: 'cancel' })

		await expect(getHistory(client, maxItemsPerRequest * maxRequestsBeforeWarning + 1, maxItemsPerRequest,
			params)).rejects.toThrow()

		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(historyDevicesMock).toHaveBeenCalledTimes(0)
		expect(hasNextMock).toHaveBeenCalledTimes(0)
		expect(nextMock).toHaveBeenCalledTimes(0)
	})

	it('limits large query when requested to do so', async () => {
		promptMock.mockResolvedValueOnce({ answer: 'reduce' })
		const firstItemSet = items.slice(0, maxItemsPerRequest)
		const historyResponse = makeHistoryResponse(firstItemSet)
		historyDevicesMock.mockResolvedValueOnce(historyResponse)
		hasNextMock.mockReturnValue(true)
		let nextStart = 300
		nextMock.mockImplementation(async () => {
			historyResponse.items = items.slice(nextStart, nextStart + maxItemsPerRequest)
			nextStart += maxItemsPerRequest
		})

		const result = await getHistory(client, maxItemsPerRequest * maxRequestsBeforeWarning + 1,
			maxItemsPerRequest, params)
		expect(result).toStrictEqual(items.slice(0, maxRequestsBeforeWarning * maxItemsPerRequest))

		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(historyDevicesMock).toHaveBeenCalledTimes(1)
		expect(historyDevicesMock).toHaveBeenCalledWith(params)
		expect(hasNextMock).toHaveBeenCalledTimes(5)
		expect(nextMock).toHaveBeenCalledTimes(5)
	})

	it('makes all requests when asked to', async () => {
		promptMock.mockResolvedValueOnce({ answer: 'yes' })
		const firstItemSet = items.slice(0, maxItemsPerRequest)
		const historyResponse = makeHistoryResponse(firstItemSet)
		historyDevicesMock.mockResolvedValueOnce(historyResponse)
		hasNextMock.mockReturnValue(true)
		let nextStart = 300
		nextMock.mockImplementation(async () => {
			historyResponse.items = items.slice(nextStart, nextStart + maxItemsPerRequest)
			nextStart += maxItemsPerRequest
		})

		const result = await getHistory(client, items.length, maxItemsPerRequest, params)
		expect(result).toStrictEqual(items)

		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(historyDevicesMock).toHaveBeenCalledTimes(1)
		expect(historyDevicesMock).toHaveBeenCalledWith(params)
		expect(hasNextMock).toHaveBeenCalledTimes(6)
		expect(nextMock).toHaveBeenCalledTimes(6)
	})

	it('ignores some result from last request to return no more than requested limit', async () => {
		promptMock.mockResolvedValueOnce({ answer: 'yes' })
		const firstItemSet = items.slice(0, maxItemsPerRequest)
		const historyResponse = makeHistoryResponse(firstItemSet)
		historyDevicesMock.mockResolvedValueOnce(historyResponse)
		hasNextMock.mockReturnValue(true)
		let nextStart = 300
		nextMock.mockImplementation(async () => {
			historyResponse.items = items.slice(nextStart, nextStart + maxItemsPerRequest)
			nextStart += maxItemsPerRequest
		})

		const result = await getHistory(client, items.length - 5, maxItemsPerRequest, params)
		expect(result).toStrictEqual(items.slice(0, items.length - 5))

		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(historyDevicesMock).toHaveBeenCalledTimes(1)
		expect(historyDevicesMock).toHaveBeenCalledWith(params)
		expect(hasNextMock).toHaveBeenCalledTimes(6)
		expect(nextMock).toHaveBeenCalledTimes(6)
	})

	it('stops paging when results are before specified after', async () => {
		const epochTimestamp = 1701097200 // 2023/11/27 9:00 a.m. CST
		const makeActivity = (index: number, epoch: number): DeviceActivity => ({
			deviceId: 'history-device-id',
			text: `item${index}`,
			epoch,
		} as DeviceActivity)
		const firstPage = [
			makeActivity(0, epochTimestamp + 600),
			makeActivity(1, epochTimestamp + 500),
			makeActivity(2, epochTimestamp + 400),
		]
		const secondPage = [
			makeActivity(3, epochTimestamp + 300),
			makeActivity(4, epochTimestamp + 200),
			makeActivity(5, epochTimestamp + 100),
		]
		const historyResponse = makeHistoryResponse(firstPage)
		historyDevicesMock.mockResolvedValueOnce(historyResponse)
		hasNextMock.mockReturnValue(true)
		nextMock.mockImplementationOnce(async () => historyResponse.items = secondPage)

		const paramsWithAfter = { ...params, after: epochTimestamp + 350 }

		const result = await getHistory(client, 300, 3, paramsWithAfter)
		expect(result).toStrictEqual(firstPage)

		expect(historyDevicesMock).toHaveBeenCalledTimes(1)
		expect(historyDevicesMock).toHaveBeenCalledWith(paramsWithAfter)
		expect(hasNextMock).toHaveBeenCalledTimes(1)
		expect(nextMock).toHaveBeenCalledTimes(1)
	})
})
