import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type {
	Device,
	DeviceActivity,
	DevicesEndpoint,
	HistoryEndpoint,
	PaginatedList,
} from '@smartthings/core-sdk'

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

const { apiCommandBuilderMock, apiCommandMock } = apiCommandMocks()

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
	expect(cmd.command).toBe('devices:history [id-or-index..]')

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(buildOutputFormatterBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(historyBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(buildOutputFormatterBuilderArgvMock)

	expect(positionalMock).toHaveBeenCalledExactlyOnceWith('id-or-index', {
		array: true,
		describe: 'the device id or number in list',
		type: 'string',
	})
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(JSON.stringify(exampleMock.mock.calls[0][0])).toContain('$0 devices:history device-a device-b')
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const apiDevicesGetMock = jest.fn<typeof DevicesEndpoint.prototype.get>()
	const apiDevicesListMock = jest.fn<typeof DevicesEndpoint.prototype.list>()
	const apiHistoryDevicesMock = jest.fn<typeof HistoryEndpoint.prototype.devices>()
	const cliConfig = { profile: {} } as CLIConfig
	const command = {
		client: {
			devices: {
				get: apiDevicesGetMock,
				list: apiDevicesListMock,
			},
			history: {
				devices: apiHistoryDevicesMock,
			},
		},
		cliConfig,
	} as unknown as APICommand<ArgumentsCamelCase<CommandArgs>>
	apiCommandMock.mockResolvedValue(command)

	const device = { deviceId: 'device-id', locationId: 'location-id' } as Device
	const deviceA = { deviceId: 'device-a', label: 'Device A', locationId: 'location-a' } as Device
	const deviceB = { deviceId: 'device-b', label: 'Device B', locationId: 'location-b' } as Device
	const deviceC = { deviceId: 'device-c', label: 'Device C', locationId: 'location-a' } as Device

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
	const inputWithDevices = (
			ids: string[],
			overrides: Record<string, unknown> = {},
	): ArgumentsCamelCase<CommandArgs> => ({
		...defaultInputArgv,
		...overrides,
		idOrIndex: ids,
	}) as unknown as ArgumentsCamelCase<CommandArgs>
	const setMetadata = (devices: Device[]): void => {
		const devicesById = new Map(devices.map(device => [device.deviceId, device]))
		apiDevicesGetMock.mockImplementation(async deviceId => {
			const metadata = devicesById.get(deviceId)
			if (metadata === undefined) {
				throw Error(`missing test metadata for ${deviceId}`)
			}
			return metadata
		})
	}
	const noOutputStarted = (): void => {
		expect(apiHistoryDevicesMock).not.toHaveBeenCalled()
		expect(getHistoryMock).not.toHaveBeenCalled()
		expect(writeDeviceEventsTableMock).not.toHaveBeenCalled()
		expect(buildOutputFormatterMock).not.toHaveBeenCalled()
		expect(writeOutputMock).not.toHaveBeenCalled()
	}
	const deferred = <T>(): {
		promise: Promise<T>
		reject: (reason?: unknown) => void
		resolve: (value: T | PromiseLike<T>) => void
	} => {
		let resolve!: (value: T | PromiseLike<T>) => void
		let reject!: (reason?: unknown) => void
		const promise = new Promise<T>((promiseResolve, promiseReject) => {
			resolve = promiseResolve
			reject = promiseReject
		})
		return { promise, reject, resolve }
	}

	beforeEach(() => {
		apiDevicesGetMock.mockReset().mockResolvedValue(device)
		apiDevicesListMock.mockReset()
		apiHistoryDevicesMock.mockReset()
		calculateOutputFormatMock.mockReset()
		calculateRequestLimitMock.mockReset().mockReturnValue(30)
		getHistoryMock.mockReset()
		toEpochTimeMock.mockReset()
		writeDeviceEventsTableMock.mockReset()
		buildOutputFormatterMock.mockReset()
		writeOutputMock.mockReset()
		chooseDeviceMock.mockReset().mockImplementation(async (selectedCommand, idOrIndex, options) => {
			if (idOrIndex === undefined) {
				return 'chosen-device-id'
			}
			if (/^[1-9][0-9]*$/.test(idOrIndex)) {
				const listedDevices = await options?.listItems?.(selectedCommand)
				if (listedDevices === undefined) {
					throw Error('numeric test input requires listItems')
				}
				const matchingDevice = listedDevices[Number(idOrIndex) - 1]
				if (matchingDevice === undefined) {
					throw Error(`invalid test index ${idOrIndex}`)
				}
				return matchingDevice.deviceId
			}
			return idOrIndex
		})
	})

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

	it('keeps one explicitly provided device scalar with the existing common columns', async () => {
		calculateOutputFormatMock.mockReturnValue('common')
		setMetadata([deviceA])
		apiHistoryDevicesMock.mockResolvedValueOnce(deviceHistory)
		const inputArgv = inputWithDevices(['device-a'])

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(chooseDeviceMock).toHaveBeenCalledExactlyOnceWith(
			command,
			'device-a',
			expect.objectContaining({ allowIndex: true }),
		)
		expect(apiDevicesListMock).not.toHaveBeenCalled()
		expect(apiDevicesGetMock).toHaveBeenCalledExactlyOnceWith('device-a')
		expect(apiHistoryDevicesMock).toHaveBeenCalledExactlyOnceWith({
			deviceId: 'device-a',
			locationId: 'location-a',
			limit: 30,
			before: undefined,
			after: undefined,
		})
		expect(writeDeviceEventsTableMock)
			.toHaveBeenCalledExactlyOnceWith(command, deviceHistory, { utcTimeFormat: false })
	})

	it('queries multiple direct IDs once and uses a scalar shared location', async () => {
		calculateOutputFormatMock.mockReturnValue('common')
		const deviceBInSameLocation = { ...deviceB, locationId: 'location-a' }
		setMetadata([deviceA, deviceBInSameLocation])
		apiHistoryDevicesMock.mockResolvedValueOnce(deviceHistory)

		await expect(cmd.handler(inputWithDevices(['device-a', 'device-b']))).resolves.not.toThrow()

		expect(chooseDeviceMock).toHaveBeenCalledTimes(2)
		expect(apiDevicesGetMock).toHaveBeenNthCalledWith(1, 'device-a')
		expect(apiDevicesGetMock).toHaveBeenNthCalledWith(2, 'device-b')
		expect(apiHistoryDevicesMock).toHaveBeenCalledExactlyOnceWith({
			deviceId: ['device-a', 'device-b'],
			locationId: 'location-a',
			limit: 30,
			before: undefined,
			after: undefined,
		})
		expect(writeDeviceEventsTableMock).toHaveBeenCalledExactlyOnceWith(
			command,
			deviceHistory,
			{ includeName: true, utcTimeFormat: false },
		)
		expect(getHistoryMock).not.toHaveBeenCalled()
		expect(buildOutputFormatterMock).not.toHaveBeenCalled()
		expect(writeOutputMock).not.toHaveBeenCalled()
	})

	it('deduplicates locations in first-device order', async () => {
		calculateOutputFormatMock.mockReturnValue('common')
		setMetadata([deviceA, deviceB, deviceC])
		apiHistoryDevicesMock.mockResolvedValueOnce(deviceHistory)

		await expect(cmd.handler(inputWithDevices(['device-a', 'device-b', 'device-c'])))
			.resolves.not.toThrow()

		expect(apiDevicesListMock).not.toHaveBeenCalled()
		expect(apiHistoryDevicesMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			deviceId: ['device-a', 'device-b', 'device-c'],
			locationId: ['location-a', 'location-b'],
		}))
	})

	it('uses one shared device-list snapshot for multiple numeric inputs', async () => {
		calculateOutputFormatMock.mockReturnValue('common')
		apiDevicesListMock.mockResolvedValueOnce([deviceA, deviceB])
		setMetadata([deviceA, deviceB])
		apiHistoryDevicesMock.mockResolvedValueOnce(deviceHistory)

		await expect(cmd.handler(inputWithDevices(['1', '2']))).resolves.not.toThrow()

		expect(chooseDeviceMock).toHaveBeenCalledTimes(2)
		expect(chooseDeviceMock).toHaveBeenNthCalledWith(1, command, '1', {
			allowIndex: true,
			listItems: expect.any(Function),
		})
		expect(chooseDeviceMock).toHaveBeenNthCalledWith(2, command, '2', {
			allowIndex: true,
			listItems: expect.any(Function),
		})
		expect(apiDevicesListMock).toHaveBeenCalledExactlyOnceWith()
		expect(apiHistoryDevicesMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			deviceId: ['device-a', 'device-b'],
			locationId: ['location-a', 'location-b'],
		}))
	})

	it('deduplicates mixed ID and index inputs in first-resolved order', async () => {
		calculateOutputFormatMock.mockReturnValue('common')
		apiDevicesListMock.mockResolvedValueOnce([deviceA, deviceB])
		setMetadata([deviceA, deviceB])
		apiHistoryDevicesMock.mockResolvedValueOnce(deviceHistory)

		await expect(cmd.handler(inputWithDevices(['device-b', '1', 'device-b', '2'])))
			.resolves.not.toThrow()

		expect(chooseDeviceMock).toHaveBeenCalledTimes(4)
		expect(apiDevicesListMock).toHaveBeenCalledExactlyOnceWith()
		expect(apiDevicesGetMock).toHaveBeenCalledTimes(2)
		expect(apiDevicesGetMock).toHaveBeenNthCalledWith(1, 'device-b')
		expect(apiDevicesGetMock).toHaveBeenNthCalledWith(2, 'device-a')
		expect(apiHistoryDevicesMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			deviceId: ['device-b', 'device-a'],
			locationId: ['location-b', 'location-a'],
		}))
	})

	it('keeps duplicate inputs that resolve to one unique device scalar', async () => {
		calculateOutputFormatMock.mockReturnValue('common')
		setMetadata([deviceA])
		apiHistoryDevicesMock.mockResolvedValueOnce(deviceHistory)

		await expect(cmd.handler(inputWithDevices(['device-a', 'device-a']))).resolves.not.toThrow()

		expect(apiDevicesGetMock).toHaveBeenCalledExactlyOnceWith('device-a')
		expect(apiHistoryDevicesMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			deviceId: 'device-a',
			locationId: 'location-a',
		}))
		expect(writeDeviceEventsTableMock)
			.toHaveBeenCalledExactlyOnceWith(command, deviceHistory, { utcTimeFormat: false })
	})

	it('waits for all metadata and keeps location order when promises resolve in reverse', async () => {
		calculateOutputFormatMock.mockReturnValue('common')
		apiHistoryDevicesMock.mockResolvedValueOnce(deviceHistory)
		const metadataA = deferred<Device>()
		const metadataB = deferred<Device>()
		apiDevicesGetMock.mockImplementation(deviceId => {
			if (deviceId === 'device-a') {
				return metadataA.promise
			}
			if (deviceId === 'device-b') {
				return metadataB.promise
			}
			throw Error(`unexpected device id ${deviceId}`)
		})

		const handlerPromise = cmd.handler(inputWithDevices(['device-a', 'device-b']))
		await new Promise<void>(resolve => setImmediate(resolve))

		expect(apiDevicesGetMock).toHaveBeenCalledTimes(2)
		noOutputStarted()

		metadataB.resolve(deviceB)
		await new Promise<void>(resolve => setImmediate(resolve))
		noOutputStarted()

		metadataA.resolve(deviceA)
		await expect(handlerPromise).resolves.not.toThrow()

		expect(apiHistoryDevicesMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			deviceId: ['device-a', 'device-b'],
			locationId: ['location-a', 'location-b'],
		}))
	})

	it.each(['common', 'json'] as const)(
		'does not start history or output when metadata lookup fails for %s output',
		async format => {
			calculateOutputFormatMock.mockReturnValue(format)
			apiDevicesGetMock
				.mockResolvedValueOnce(deviceA)
				.mockRejectedValueOnce(Error('metadata unavailable'))

			await expect(cmd.handler(inputWithDevices(['device-a', 'device-b'])))
				.rejects.toThrow('metadata unavailable')

			expect(apiDevicesGetMock).toHaveBeenCalledTimes(2)
			noOutputStarted()
		},
	)

	it.each([
		{ format: 'common' as const, locationId: undefined },
		{ format: 'json' as const, locationId: '' },
	])('rejects location $locationId before starting $format output', async ({ format, locationId }) => {
		calculateOutputFormatMock.mockReturnValue(format)
		setMetadata([deviceA, { ...deviceB, locationId } as Device])

		await expect(cmd.handler(inputWithDevices(['device-a', 'device-b'])))
			.rejects.toThrow(/location/i)

		noOutputStarted()
	})

	it('handles an empty combined common response once', async () => {
		calculateOutputFormatMock.mockReturnValue('common')
		setMetadata([deviceA, deviceB])
		const emptyHistory = { ...deviceHistory, items: [] } as unknown as PaginatedList<DeviceActivity>
		apiHistoryDevicesMock.mockResolvedValueOnce(emptyHistory)

		await expect(cmd.handler(inputWithDevices(['device-a', 'device-b']))).resolves.not.toThrow()

		expect(apiHistoryDevicesMock).toHaveBeenCalledTimes(1)
		expect(writeDeviceEventsTableMock).toHaveBeenCalledExactlyOnceWith(
			command,
			emptyHistory,
			{ includeName: true, utcTimeFormat: false },
		)
	})

	it('notifies user of max per-request limit if they request more', async () => {
		calculateOutputFormatMock.mockReturnValue('common')
		calculateRequestLimitMock.mockReturnValueOnce(13)
		apiHistoryDevicesMock.mockResolvedValueOnce(deviceHistory)

		await expect(cmd.handler({ ...defaultInputArgv, limit: 31 })).resolves.not.toThrow()

		expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('History is limited to'))
	})

	it('applies limit, before, after, UTC, and the common warning once to the combined stream', async () => {
		calculateOutputFormatMock.mockReturnValue('common')
		calculateRequestLimitMock.mockReturnValueOnce(13)
		setMetadata([deviceA, deviceB])
		apiHistoryDevicesMock.mockResolvedValueOnce(deviceHistory)
		toEpochTimeMock.mockImplementation(value => value === 'before-value' ? 101 : 202)
		const inputArgv = inputWithDevices(['device-a', 'device-b'], {
			after: 'after-value',
			before: 'before-value',
			limit: 31,
			utc: true,
		})

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(calculateRequestLimitMock).toHaveBeenCalledExactlyOnceWith(31)
		expect(toEpochTimeMock).toHaveBeenCalledTimes(2)
		expect(toEpochTimeMock).toHaveBeenNthCalledWith(1, 'before-value')
		expect(toEpochTimeMock).toHaveBeenNthCalledWith(2, 'after-value')
		expect(apiHistoryDevicesMock).toHaveBeenCalledExactlyOnceWith({
			deviceId: ['device-a', 'device-b'],
			locationId: ['location-a', 'location-b'],
			limit: 13,
			before: 101,
			after: 202,
		})
		expect(writeDeviceEventsTableMock).toHaveBeenCalledExactlyOnceWith(
			command,
			deviceHistory,
			{ includeName: true, utcTimeFormat: true },
		)
		expect(consoleLogSpy).toHaveBeenCalledExactlyOnceWith('History is limited to 13 items per request.')
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

	it.each([
		{
			format: 'json' as const,
			items,
			name: 'JSON',
			overrides: { json: true },
			output: undefined,
		},
		{
			format: 'yaml' as const,
			items: [] as DeviceActivity[],
			name: 'empty YAML output file',
			overrides: { output: 'combined-history.yaml', yaml: true },
			output: 'combined-history.yaml',
		},
	])('writes one combined $name result', async ({ format, items: outputItems, output, overrides }) => {
		calculateOutputFormatMock.mockReturnValue(format)
		setMetadata([deviceA, deviceB])
		getHistoryMock.mockResolvedValueOnce(outputItems)
		const outputFormatterMock = jest.fn<OutputFormatter<DeviceActivity[]>>().mockReturnValue('formatted')
		buildOutputFormatterMock.mockReturnValueOnce(outputFormatterMock)
		const inputArgv = inputWithDevices(['device-a', 'device-b'], overrides)

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(getHistoryMock).toHaveBeenCalledExactlyOnceWith(
			command.client,
			27,
			30,
			{
				deviceId: ['device-a', 'device-b'],
				locationId: ['location-a', 'location-b'],
				limit: 30,
				before: undefined,
				after: undefined,
			},
		)
		expect(buildOutputFormatterMock).toHaveBeenCalledExactlyOnceWith(inputArgv, cliConfig)
		expect(outputFormatterMock).toHaveBeenCalledExactlyOnceWith(outputItems)
		expect(writeOutputMock).toHaveBeenCalledExactlyOnceWith('formatted', output)
		expect(apiHistoryDevicesMock).not.toHaveBeenCalled()
		expect(writeDeviceEventsTableMock).not.toHaveBeenCalled()
	})
})
