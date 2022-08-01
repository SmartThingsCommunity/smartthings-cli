import inquirer from 'inquirer'
import { DeviceActivity, PaginatedList } from '@smartthings/core-sdk'
import { SmartThingsCommandInterface, Table, TableGenerator } from '@smartthings/cli-lib'
import {
	toEpochTime,
	sortEvents,
	getNextDeviceEvents,
	writeDeviceEventsTable,
} from '../../../lib/commands/history-util'


describe('devices-util', () => {

	describe('epochTime', () => {
		it ('handles ISO input', () => {
			expect(toEpochTime('2022-08-01T22:41:42.559Z')).toBe(1659393702559)
		})

		it ('handles locale time input', () => {
			const expected = new Date('8/1/2022, 6:41:42 PM').getTime()
			expect(toEpochTime('8/1/2022, 6:41:42 PM')).toBe(expected)
		})

		it ('handles undefined input', () => {
			expect(toEpochTime(undefined)).toBeUndefined()
		})
	})

	describe('sortEvents', () => {
		it('sorts in reverse order', () => {
			const events = [
				{ epoch: 1659394186591 },
				{ epoch: 1659394186592 },
				{ epoch: 1659394186593 },
				{ epoch: 1659394186590 },
			] as DeviceActivity[]

			const result = sortEvents([...events])

			expect(result).toBeDefined()
			expect(result.length).toBe(4)
			expect(result[0]).toBe(events[2])
			expect(result[1]).toBe(events[1])
			expect(result[2]).toBe(events[0])
			expect(result[3]).toBe(events[3])
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
			promptSpy.mockResolvedValueOnce({ more: '' })
			promptSpy.mockResolvedValueOnce({ more: 'y' })

			await writeDeviceEventsTable(commandMock, dataMock)

			expect(newOutputTableMock).toHaveBeenCalledTimes(3)
			expect(tablePushMock).toHaveBeenCalledTimes(3)
			expect(stdOutSpy).toHaveBeenCalledTimes(3)
		})

		it('returns next page until canceled', async () => {
			hasNext.mockReturnValue(true)
			promptSpy.mockResolvedValueOnce({ more: '' })
			promptSpy.mockResolvedValueOnce({ more: 'n' })

			await writeDeviceEventsTable(commandMock, dataMock)

			expect(newOutputTableMock).toHaveBeenCalledTimes(2)
			expect(tablePushMock).toHaveBeenCalledTimes(2)
			expect(stdOutSpy).toHaveBeenCalledTimes(2)
		})
	})
})
