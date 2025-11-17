import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { Device, DevicePreferenceResponse, DevicesEndpoint } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/devices/preferences.js'
import type { buildEpilog } from '../../../lib/help.js'
import type { APICommand } from '../../../lib/command/api-command.js'
import type {
	CustomCommonOutputProducer,
	formatAndWriteItem,
	formatAndWriteItemBuilder,
} from '../../../lib/command/format.js'
import type { BuildOutputFormatterFlags } from '../.././../lib/command/output-builder.js'
import type { SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'
import type { ChooseFunction } from '../../../lib/command/util/util-util.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'
import {
	mockedTableOutput,
	newOutputTableMock,
	tableGeneratorMock,
	tablePushMock,
	tableToStringMock,
} from '../../test-lib/table-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../..')

const chooseDeviceMock = jest.fn<ChooseFunction<Device>>()
jest.unstable_mockModule('../../../lib/command/util/devices-choose.js', () => ({
	chooseDevice: chooseDeviceMock,
}))

const formatAndWriteItemMock = jest.fn<typeof formatAndWriteItem<DevicePreferenceResponse>>()
const formatAndWriteItemBuilderMock = jest.fn<typeof formatAndWriteItemBuilder>()
jest.unstable_mockModule('../../../lib/command/format.js', () => ({
	formatAndWriteItem: formatAndWriteItemMock,
	formatAndWriteItemBuilder: formatAndWriteItemBuilderMock,
}))


const { default: cmd, buildTableOutput } = await import('../../../commands/devices/preferences.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, BuildOutputFormatterFlags>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	formatAndWriteItemBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(formatAndWriteItemBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledOnce()
	expect(exampleMock).toHaveBeenCalledOnce()
	expect(buildEpilogMock).toHaveBeenCalledOnce()
	expect(epilogMock).toHaveBeenCalledOnce()
})

const preferences: DevicePreferenceResponse = {
	values: {
		key0: {
			preferenceType: 'string',
			value: 'preference string 0',
		},
		key2: {
			preferenceType: 'string',
			value: 'preference string 2',
		},
		key1: {
			preferenceType: 'string',
			value: 'preference string 1',
		},
	},
}

describe('buildTableOutput', () => {
	it('skips table entirely when there is no data', () => {
		expect(buildTableOutput(tableGeneratorMock, {} as DevicePreferenceResponse)).toBe('')

		expect(newOutputTableMock).not.toHaveBeenCalled()
		expect(tablePushMock).not.toHaveBeenCalled()
		expect(tableToStringMock).not.toHaveBeenCalled()
	})

	it('sorts by key', () => {
		expect(buildTableOutput(tableGeneratorMock, preferences)).toBe(mockedTableOutput)

		expect(newOutputTableMock).toHaveBeenCalledOnce()
		expect(tablePushMock).toHaveBeenCalledTimes(3)
		expect(tablePushMock).toHaveBeenCalledWith(['key0', 'string', 'preference string 0'])
		expect(tablePushMock).toHaveBeenCalledWith(['key1', 'string', 'preference string 1'])
		expect(tablePushMock).toHaveBeenCalledWith(['key2', 'string', 'preference string 2'])
		expect(tablePushMock.mock.calls[0][0][0]).toBe('key0')
		expect(tablePushMock.mock.calls[1][0][0]).toBe('key1')
		expect(tablePushMock.mock.calls[2][0][0]).toBe('key2')
		expect(tableToStringMock).toHaveBeenCalledExactlyOnceWith()
	})
})

test('handler', async () => {
	const apiDevicesGetPreferencesMock = jest.fn<typeof DevicesEndpoint.prototype.getPreferences>()
	const command = {
		client: {
			devices: {
				getPreferences: apiDevicesGetPreferencesMock,
			},
		},
		tableGenerator: tableGeneratorMock,
	} as unknown as APICommand<CommandArgs>
	apiCommandMock.mockResolvedValueOnce(command)
	chooseDeviceMock.mockResolvedValueOnce('chosen-device-id')
	apiDevicesGetPreferencesMock.mockResolvedValueOnce(preferences)

	const inputArgv = {
		idOrIndex: 'argv-id-or-index',
		profile: 'default',
	} as ArgumentsCamelCase<CommandArgs>
	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseDeviceMock).toHaveBeenCalledExactlyOnceWith(command, 'argv-id-or-index', { allowIndex: true })
	expect(apiDevicesGetPreferencesMock).toHaveBeenCalledExactlyOnceWith('chosen-device-id')
	expect(formatAndWriteItemMock).toHaveBeenCalledExactlyOnceWith(
		command,
		expect.objectContaining({
			buildTableOutput: expect.any(Function),
		}),
		preferences,
	)

	const config = formatAndWriteItemMock.mock.calls[0][1] as CustomCommonOutputProducer<DevicePreferenceResponse>

	expect(config.buildTableOutput(preferences)).toBe(mockedTableOutput)
})
