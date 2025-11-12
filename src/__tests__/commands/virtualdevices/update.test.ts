import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import { DeviceIntegrationType, type Device, type DevicesEndpoint, type DeviceUpdate } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/devices/update.js'
import type { buildEpilog } from '../../../lib/help.js'
import type { APICommand, APICommandFlags } from '../../../lib/command/api-command.js'
import type { CustomCommonOutputProducer } from '../../../lib/command/format.js'
import type { inputAndOutputItem, inputAndOutputItemBuilder } from '../../../lib/command/input-and-output-item.js'
import type { chooseDeviceFn } from '../../../lib/command/util/devices-choose.js'
import type { buildTableOutput } from '../../../lib/command/util/devices-table.js'
import type { ChooseFunction } from '../../../lib/command/util/util-util.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'
import { tableGeneratorMock } from '../../test-lib/table-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({ buildEpilog: buildEpilogMock }))
const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../..')

const inputAndOutputItemMock = jest.fn<typeof inputAndOutputItem<DeviceUpdate, Device>>()
const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../lib/command/input-and-output-item.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))

const buildTableOutputMock = jest.fn<typeof buildTableOutput>()
jest.unstable_mockModule('../../../lib/command/util/devices-table.js', () => ({
	buildTableOutput: buildTableOutputMock,
}))

const chooseDeviceMock = jest.fn<ChooseFunction<Device>>()
const chooseDeviceFnMock = jest.fn<typeof chooseDeviceFn>().mockReturnValue(chooseDeviceMock)
jest.unstable_mockModule('../../../lib/command/util/devices-choose.js', () => ({
	chooseDeviceFn: chooseDeviceFnMock,
}))


const { default: cmd } = await import('../../../commands/virtualdevices/update.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APICommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValueOnce(apiCommandBuilderArgvMock)
	inputAndOutputItemBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledTimes(1)
	expect(apiCommandBuilderMock).toHaveBeenCalledWith(yargsMock)
	expect(inputAndOutputItemBuilderMock).toHaveBeenCalledTimes(1)
	expect(inputAndOutputItemBuilderMock).toHaveBeenCalledWith(apiCommandBuilderArgvMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiDevicesUpdateMock = jest.fn<typeof DevicesEndpoint.prototype.update>()
	const command = {
		client: {
			devices: {
				update: apiDevicesUpdateMock,
			},
		},
		tableGenerator: tableGeneratorMock,
	} as unknown as APICommand<APICommandFlags>
	apiCommandMock.mockResolvedValue(command)
	chooseDeviceMock.mockResolvedValue('chosen-id')

	const inputArgv = {
		profile: 'default',
		id: 'cmd-line-id',
	} as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseDeviceFnMock).toHaveBeenCalledExactlyOnceWith({ type: DeviceIntegrationType.VIRTUAL })
	expect(chooseDeviceMock).toHaveBeenCalledExactlyOnceWith(command, 'cmd-line-id')
	expect(inputAndOutputItemMock).toHaveBeenCalledExactlyOnceWith(
		command,
		{ buildTableOutput: expect.any(Function) },
		expect.any(Function),
	)

	const deviceToUpdate = { label: 'Device To Update' } as DeviceUpdate
	const updatedDevice = { name: 'Updated Device' } as Device

	const config = inputAndOutputItemMock.mock.calls[0][1] as CustomCommonOutputProducer<Device>
	buildTableOutputMock.mockReturnValueOnce('table output')
	expect(config.buildTableOutput(updatedDevice)).toBe('table output')
	expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, updatedDevice)

	const update = inputAndOutputItemMock.mock.calls[0][2]

	apiDevicesUpdateMock.mockResolvedValueOnce(updatedDevice)

	expect(await update(undefined, deviceToUpdate)).toBe(updatedDevice)

	expect(apiDevicesUpdateMock).toHaveBeenCalledExactlyOnceWith('chosen-id', deviceToUpdate)
})
