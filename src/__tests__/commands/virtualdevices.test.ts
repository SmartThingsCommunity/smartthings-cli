import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import {
	DeviceIntegrationType,
	type Device,
	type DevicesEndpoint,
	type SmartThingsClient,
} from '@smartthings/core-sdk'

import type { withLocationsAndRooms, WithNamedRoom } from '../../lib/api-helpers.js'
import type { APICommand, APICommandFlags } from '../../lib/command/api-command.js'
import type { CustomCommonOutputProducer } from '../../lib/command/format.js'
import type { outputItemOrList, outputItemOrListBuilder } from '../../lib/command/listing-io.js'
import type { CommandArgs } from '../../commands/virtualdevices.js'
import type { BuildOutputFormatterFlags } from '../../lib/command/output-builder.js'
import type { SmartThingsCommandFlags } from '../../lib/command/smartthings-command.js'
import { buildTableOutput } from '../../lib/command/util/devices-table.js'
import { apiCommandMocks } from '../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../test-lib/builder-mock.js'
import { tableGeneratorMock } from '../test-lib/table-mock.js'


const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../..')

const outputItemOrListMock = jest.fn<typeof outputItemOrList<Device & WithNamedRoom>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))

const withLocationsAndRoomsMock = jest.fn<typeof withLocationsAndRooms>()
jest.unstable_mockModule('../../lib/api-helpers.js', () => ({
	withLocationsAndRooms: withLocationsAndRoomsMock,
}))

const buildTableOutputMock = jest.fn<typeof buildTableOutput>()
jest.unstable_mockModule('../../lib/command/util/devices-table.js', () => ({
	buildTableOutput: buildTableOutputMock,
}))


const { default: cmd } = await import('../../commands/virtualdevices.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		optionMock,
		positionalMock,
		exampleMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, BuildOutputFormatterFlags>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputItemOrListBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(3)
	expect(exampleMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const virtualDevice = { deviceId: 'device-id' } as Device
	const virtualDeviceList = [{ deviceId: 'paged-device-id' }] as Device[]

	const apiDevicesListMock = jest.fn<typeof DevicesEndpoint.prototype.list>()
		.mockResolvedValue(virtualDeviceList)
	const apiDevicesGetMock = jest.fn<typeof DevicesEndpoint.prototype.get>()
		.mockResolvedValue(virtualDevice)
	const clientMock = {
		devices: {
			list: apiDevicesListMock,
			get: apiDevicesGetMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
		tableGenerator: tableGeneratorMock,
	} as APICommand<APICommandFlags>
	apiCommandMock.mockResolvedValue(command)

	const defaultInputArgv = {
		profile: 'default',
	} as ArgumentsCamelCase<CommandArgs>

	it('lists virtualdevices without args', async () => {
		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(defaultInputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				primaryKeyName: 'deviceId',
				listTableFieldDefinitions: ['label', 'deviceId'],
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		apiDevicesListMock.mockResolvedValueOnce(virtualDeviceList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(virtualDeviceList)

		expect(apiDevicesListMock).toHaveBeenCalledExactlyOnceWith({
			locationId: undefined,
			installedAppId: undefined,
			type: DeviceIntegrationType.VIRTUAL,
		})

		expect(withLocationsAndRoomsMock).not.toHaveBeenCalled()
	})

	it('includes location and room with verbose flag', async () => {
		await expect(cmd.handler({ ...defaultInputArgv, verbose: true })).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				listTableFieldDefinitions: ['label', 'deviceId', 'location', 'room'],
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		apiDevicesListMock.mockResolvedValueOnce(virtualDeviceList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]
		const verboseVirtualDeviceList =
			[{ deviceId: 'verbose-device-id' }] as (Device & WithNamedRoom)[]
		withLocationsAndRoomsMock.mockResolvedValueOnce(verboseVirtualDeviceList)

		expect(await listFunction()).toBe(verboseVirtualDeviceList)

		expect(apiDevicesListMock).toHaveBeenCalledExactlyOnceWith({
			locationId: undefined,
			installedAppId: undefined,
			type: DeviceIntegrationType.VIRTUAL,
		})
		expect(withLocationsAndRoomsMock)
			.toHaveBeenCalledExactlyOnceWith(clientMock, virtualDeviceList)
	})

	it('lists details of a specified virtual device', async () => {
		const inputArgv = {
			...defaultInputArgv,
			idOrIndex: 'device-from-arg',
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'deviceId' }),
			'device-from-arg',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		expect(await getFunction('chosen-device-id')).toStrictEqual(virtualDevice)

		expect(apiDevicesGetMock).toHaveBeenCalledExactlyOnceWith('chosen-device-id')

		const config = outputItemOrListMock.mock.calls[0][1] as
			CustomCommonOutputProducer<Device & WithNamedRoom>
		const buildTableOutput = config.buildTableOutput

		buildTableOutputMock.mockReturnValueOnce('device summary')
		expect(buildTableOutput(virtualDevice)).toBe('device summary')
		expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, virtualDevice)
	})

	it('narrows by location when requested', async () => {
		await expect(cmd.handler({ ...defaultInputArgv, location: 'location-id' }))
			.resolves.not.toThrow()

		apiDevicesListMock.mockResolvedValueOnce(virtualDeviceList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(virtualDeviceList)

		expect(apiDevicesListMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			locationId: 'location-id',
		}))
	})

	it('narrows by installed app when requested', async () => {
		await expect(cmd.handler({ ...defaultInputArgv, installedApp: 'installed-app-id' }))
			.resolves.not.toThrow()

		apiDevicesListMock.mockResolvedValueOnce(virtualDeviceList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(virtualDeviceList)

		expect(apiDevicesListMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			installedAppId: 'installed-app-id',
		}))
	})
})
