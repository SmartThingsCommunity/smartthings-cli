import { Device, DeviceStatus, HubDeviceDetails, MatterDeviceDetails } from '@smartthings/core-sdk'

import { Table, TableFieldDefinition, TableGenerator, ValueTableFieldDefinition } from '@smartthings/cli-lib'

import {
	buildEmbeddedStatusTableOutput,
	buildStatusTableOutput,
	buildTableOutput,
} from '../../../lib/commands/devices-util.js'


const tablePushMock: jest.Mock<number, [(string | undefined)[]]> = jest.fn()
const tableToStringMock = jest.fn()
const tableMock = {
	push: tablePushMock,
	toString: tableToStringMock,
} as unknown as Table
const newOutputTableMock = jest.fn().mockReturnValue(tableMock)
const buildTableFromItemMock = jest.fn()
const buildTableFromListMock = jest.fn()

const tableGeneratorMock: TableGenerator = {
	newOutputTable: newOutputTableMock,
	buildTableFromItem: buildTableFromItemMock,
	buildTableFromList: buildTableFromListMock,
}

describe('buildStatusTableOutput', () => {
	it('handles a single component', () => {
		const deviceStatus: DeviceStatus = {
			components: {
				main: {
					switch: {
						switch: {
							value: 'off',
						},
					},
				},
			},
		}

		tableToStringMock.mockReturnValueOnce('main component status')

		expect(buildStatusTableOutput(tableGeneratorMock, deviceStatus))
			.toEqual('main component status\n')

		expect(tablePushMock).toHaveBeenCalledTimes(1)
		expect(tablePushMock).toHaveBeenCalledWith(['switch', 'switch', '"off"'])
	})

	it('handles a multiple components', () => {
		const deviceStatus: DeviceStatus = {
			components: {
				main: {
					switch: {
						switch: {
							value: 'off',
						},
					},
				},
				light: {
					switchLevel: {
						level: {
							value: 80,
						},
					},
				},
			},
		}

		tableToStringMock.mockReturnValueOnce('main component status')
		tableToStringMock.mockReturnValueOnce('light component status')

		expect(buildStatusTableOutput(tableGeneratorMock, deviceStatus))
			.toEqual('\nmain component\nmain component status\n\nlight component\nlight component status\n')

		expect(tablePushMock).toHaveBeenCalledTimes(2)
		expect(tablePushMock).toHaveBeenNthCalledWith(1, ['switch', 'switch', '"off"'])
		expect(tablePushMock).toHaveBeenNthCalledWith(2, ['switchLevel', 'level', '80'])
	})
})
