import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import {
	type Device,
	type DeviceEvent,
	type VirtualDevicesEndpoint,
	DeviceIntegrationType,
} from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/virtualdevices/events.js'
import type { APICommand, APICommandFlags } from '../../../lib/command/api-command.js'
import type { CustomCommonOutputProducer } from '../../../lib/command/format.js'
import type { inputAndOutputItem, inputAndOutputItemBuilder } from '../../../lib/command/input-and-output-item.js'
import type { InputProcessor, userInputProcessor } from '../../../lib/command/input-processor.js'
import type { chooseDeviceFn } from '../../../lib/command/util/devices-choose.js'
import type { ChooseFunction } from '../../../lib/command/util/util-util.js'
import type { getInputFromUser } from '../../../lib/command/util/virtualdevices-events.js'
import type { buildTableOutput, EventInputOutput } from '../../../lib/command/util/virtualdevices-events-table.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'
import { tableGeneratorMock } from '../../test-lib/table-mock.js'


const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../..')

const inputAndOutputItemMock = jest.fn<typeof inputAndOutputItem<DeviceEvent[], EventInputOutput[]>>()
const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../lib/command/input-and-output-item.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))

const inputProcessorMock = { ioFormat: 'common' } as InputProcessor<DeviceEvent[]>
const userInputProcessorMock = jest.fn<typeof userInputProcessor>().mockReturnValue(inputProcessorMock)
jest.unstable_mockModule('../../../lib/command/input-processor.js', () => ({
	userInputProcessor: userInputProcessorMock,
}))

const chooseDeviceMock = jest.fn<ChooseFunction<Device>>().mockResolvedValue('chosen-device-id')
const chooseDeviceFnMock = jest.fn<typeof chooseDeviceFn>().mockReturnValue(chooseDeviceMock)
jest.unstable_mockModule('../../../lib/command/util/devices-choose.js', () => ({
	chooseDeviceFn: chooseDeviceFnMock,
}))

const getInputFromUserMock = jest.fn<typeof getInputFromUser>()
jest.unstable_mockModule('../../../lib/command/util/virtualdevices-events.js', () => ({
	getInputFromUser: getInputFromUserMock,
}))

const buildTableOutputMock = jest.fn<typeof buildTableOutput>()
jest.unstable_mockModule('../../../lib/command/util/virtualdevices-events-table.js', () => ({
	buildTableOutput: buildTableOutputMock,
}))


const { default: cmd } = await import('../../../commands/virtualdevices/events.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		optionMock,
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

	expect(positionalMock).toHaveBeenCalledTimes(4)
	expect(optionMock).toHaveBeenCalledTimes(0)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiVirtualDevicesCreateEventsMock = jest.fn<typeof VirtualDevicesEndpoint.prototype.createEvents>()
	const command = {
		client: {
			virtualDevices: {
				createEvents: apiVirtualDevicesCreateEventsMock,
			},
		},
		tableGenerator: tableGeneratorMock,
	} as unknown as APICommand<ArgumentsCamelCase<CommandArgs>>
	apiCommandMock.mockResolvedValue(command)

	const inputArgv = { profile: 'default', deviceId: 'cmd-line-device-id' } as ArgumentsCamelCase<CommandArgs>

	const events = [{ capability: 'switch' }, { capability: 'batteryLevel' }, { capability: 'button' }] as DeviceEvent[]

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseDeviceFnMock).toHaveBeenCalledExactlyOnceWith({ type: DeviceIntegrationType.VIRTUAL })
	expect(chooseDeviceMock).toHaveBeenCalledExactlyOnceWith(command, 'cmd-line-device-id')
	expect(userInputProcessorMock).toHaveBeenCalledExactlyOnceWith(expect.any(Function))
	expect(inputAndOutputItemMock).toHaveBeenCalledExactlyOnceWith(
		command,
		{ buildTableOutput: expect.any(Function) },
		expect.any(Function),
		inputProcessorMock,
	)

	const getUserInput = userInputProcessorMock.mock.calls[0][0]
	getInputFromUserMock.mockResolvedValueOnce(events)

	expect(await getUserInput()).toBe(events)

	expect(getInputFromUserMock).toHaveBeenCalledExactlyOnceWith(command, inputArgv, 'chosen-device-id')

	const createEvents = inputAndOutputItemMock.mock.calls[0][2]
	apiVirtualDevicesCreateEventsMock
		.mockResolvedValueOnce({ stateChanges: [true, false, undefined as unknown as boolean] })
	const eventUpdates = [
		{ event: events[0], stateChange: true },
		{ event: events[1], stateChange: false },
		{ event: events[2], stateChange: undefined },
	]

	expect(await createEvents(undefined, events)).toStrictEqual(eventUpdates)

	const buildTableOutput = (inputAndOutputItemMock.mock.calls[0][1] as
		CustomCommonOutputProducer<EventInputOutput[]>).buildTableOutput
	buildTableOutputMock.mockReturnValueOnce('table output')

	expect(buildTableOutput(eventUpdates)).toBe('table output')

	expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, eventUpdates)
})
