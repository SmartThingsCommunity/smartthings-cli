import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { DevicesEndpoint, HistoryEndpoint, DeviceActivity, Device, PaginatedList } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/devices/history.js'
import type { CLIConfig } from '../../../lib/cli-config.js'
import type { buildEpilog } from '../../../lib/help.js'
import type { APICommand, APICommandFlags } from '../../../lib/command/api-command.js'
import type { calculateOutputFormat, OutputFormatter, writeOutput } from '../../../lib/command/output.js'
import type {
	buildOutputFormatter,
	buildOutputFormatterBuilder,
	BuildOutputFormatterFlags,
} from '../../../lib/command/output-builder.js'
import type { chooseDevice } from '../../../lib/command/util/devices-choose.js'
import type {
	calculateRequestLimit,
	getHistory,
	toEpochTime,
	writeDeviceEventsTable,
} from '../../../lib/command/util/history.js'
import type { historyBuilder } from '../../../lib/command/util/history-builder.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandBuilderMock, apiCommandMock } = apiCommandMocks('../../..')

const calculateOutputFormatMock = jest.fn<typeof calculateOutputFormat>()
const writeOutputMock = jest.fn<typeof writeOutput>()
jest.unstable_mockModule('../../../lib/command/output.js', () => ({
	calculateOutputFormat: calculateOutputFormatMock,
	writeOutput: writeOutputMock,
}))

const buildOutputFormatterMock = jest.fn<typeof buildOutputFormatter<DeviceActivity[]>>()
const buildOutputFormatterBuilderMock = jest.fn<typeof buildOutputFormatterBuilder>()
jest.unstable_mockModule('../../../lib/command/output-builder.js', () => ({
	buildOutputFormatter: buildOutputFormatterMock,
	buildOutputFormatterBuilder: buildOutputFormatterBuilderMock,
}))

const chooseDeviceMock = jest.fn<typeof chooseDevice>().mockResolvedValue('chosen-device-id')
jest.unstable_mockModule('../../../lib/command/util/devices-choose.js', () => ({
	chooseDevice: chooseDeviceMock,
}))

const calculateRequestLimitMock = jest.fn<typeof calculateRequestLimit>().mockReturnValue(30)
const getHistoryMock = jest.fn<typeof getHistory>()
const toEpochTimeMock = jest.fn<typeof toEpochTime>()
const writeDeviceEventsTableMock = jest.fn<typeof writeDeviceEventsTable>()
jest.unstable_mockModule('../../../lib/command/util/history.js', () => ({
	calculateRequestLimit: calculateRequestLimitMock,
	getHistory: getHistoryMock,
	maxItemsPerRequest: 13,
	toEpochTime: toEpochTimeMock,
	writeDeviceEventsTable: writeDeviceEventsTableMock,
}))

const historyBuilderMock = jest.fn<typeof historyBuilder>()
jest.unstable_mockModule('../../../lib/command/util/history-builder.js', () => ({
	historyBuilder: historyBuilderMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /* do nothing */ })


const { default: cmd } = await import('../../../commands/devices/history.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const apiCommandBuilderArgvMock = buildArgvMockStub<APICommandFlags>()
	const {
		yargsMock: buildOutputFormatterBuilderArgvMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APICommandFlags & BuildOutputFormatterFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValueOnce(apiCommandBuilderArgvMock)
	buildOutputFormatterBuilderMock.mockReturnValueOnce(buildOutputFormatterBuilderArgvMock)
	historyBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(buildOutputFormatterBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(historyBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(buildOutputFormatterBuilderArgvMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const apiDevicesGetMock = jest.fn<typeof DevicesEndpoint.prototype.get>()
	const apiHistoryDevicesMock = jest.fn<typeof HistoryEndpoint.prototype.devices>()
	const cliConfig = { profile: {} } as CLIConfig
	const command = {
		client: {
			devices: {
				get: apiDevicesGetMock,
			},
			history: {
				devices: apiHistoryDevicesMock,
			},
		},
		cliConfig,
	} as unknown as APICommand<ArgumentsCamelCase<CommandArgs>>
	apiCommandMock.mockResolvedValue(command)

	const device = { deviceId: 'device-id', locationId: 'location-id' } as Device
	apiDevicesGetMock.mockResolvedValue(device)

	const items = [{ deviceId: 'device-1' }] as DeviceActivity[]
	const deviceHistory = {
		items,
		hasNext: (): boolean => false,
	} as PaginatedList<DeviceActivity>

	const defaultInputArgv = {
		profile: 'default',
		limit: 27,
		utc: false,
	} as ArgumentsCamelCase<CommandArgs>

	it('uses writeDeviceEventsTable for standard output', async () => {
		calculateOutputFormatMock.mockReturnValue('common')
		apiHistoryDevicesMock.mockResolvedValueOnce(deviceHistory)

		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(defaultInputArgv)
		expect(calculateRequestLimitMock).toHaveBeenCalledExactlyOnceWith(27)
		expect(chooseDeviceMock).toHaveBeenCalledExactlyOnceWith(command, undefined, { allowIndex: true })
		expect(apiDevicesGetMock).toHaveBeenCalledExactlyOnceWith('chosen-device-id')
		expect(apiHistoryDevicesMock).toHaveBeenCalledWith(
			{ deviceId: 'chosen-device-id', locationId: 'location-id', limit: 30, before: undefined, after: undefined },
		)
		expect(writeDeviceEventsTableMock).toHaveBeenCalledExactlyOnceWith(command, deviceHistory, { utcTimeFormat: false })

		expect(getHistoryMock).not.toHaveBeenCalled()
		expect(buildOutputFormatterMock).not.toHaveBeenCalled()
		expect(writeOutputMock).not.toHaveBeenCalled()
		expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('History is limited to'))
	})

	it('notifies user of max per-request limit if they request more', async () => {
		calculateOutputFormatMock.mockReturnValue('common')
		apiHistoryDevicesMock.mockResolvedValueOnce(deviceHistory)

		await expect(cmd.handler({ ...defaultInputArgv, limit: 31 })).resolves.not.toThrow()

		expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('History is limited to'))
	})

	it('writes non-table output when specified', async () => {
		calculateOutputFormatMock.mockReturnValue('json')
		getHistoryMock.mockResolvedValueOnce(items)
		const outputFormatterMock = jest.fn<OutputFormatter<DeviceActivity[]>>()
		buildOutputFormatterMock.mockReturnValueOnce(outputFormatterMock)
		outputFormatterMock.mockReturnValueOnce('formatted')
		const inputArgv = { ...defaultInputArgv, output: 'output-filename.json' }

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(calculateRequestLimitMock).toHaveBeenCalledExactlyOnceWith(27)
		expect(chooseDeviceMock).toHaveBeenCalledExactlyOnceWith(command, undefined, { allowIndex: true })
		expect(apiDevicesGetMock).toHaveBeenCalledExactlyOnceWith('chosen-device-id')
		expect(getHistoryMock).toHaveBeenCalledExactlyOnceWith(
			command.client,
			27,
			30,
			{ deviceId: 'chosen-device-id', locationId: 'location-id', limit: 30, before: undefined, after: undefined },
		)
		expect(buildOutputFormatterMock).toHaveBeenCalledExactlyOnceWith(inputArgv, cliConfig)
		expect(outputFormatterMock).toHaveBeenCalledExactlyOnceWith(items)
		expect(writeOutputMock).toHaveBeenCalledExactlyOnceWith('formatted', 'output-filename.json')

		expect(apiHistoryDevicesMock).not.toHaveBeenCalled()
		expect(writeDeviceEventsTableMock).not.toHaveBeenCalled()
		expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('History is limited to'))
	})
})
