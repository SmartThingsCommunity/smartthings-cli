import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type {
	CapabilityStatus,
	Component,
	Device,
	DevicesEndpoint,
} from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/devices/capability-status.js'
import type {
	APICommand,
	apiCommand,
	apiCommandBuilder,
	apiDocsURL,
} from '../../../lib/command/api-command.js'
import type { stringTranslateToId } from '../../../lib/command/command-util.js'
import type {
	CustomCommonOutputProducer,
	formatAndWriteItem,
	formatAndWriteItemBuilder,
	formatAndWriteList,
} from '../../../lib/command/format.js'
import type { BuildOutputFormatterFlags } from '../.././../lib/command/output-builder.js'
import type { selectFromList } from '../../../lib/command/select.js'
import type { SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'
import {
	chooseComponentFn,
	prettyPrintAttribute,
} from '../../../lib/command/util/devices-util.js'
import type { ChooseFunction } from '../../../lib/command/util/util-util.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'
import {
	mockedTableOutput,
	newOutputTableMock,
	tableGeneratorMock,
	tablePushMock,
	tableToStringMock,
} from '../../test-lib/table-mock.js'
import type { fatalError } from '../../../lib/util.js'


const apiCommandMock = jest.fn<typeof apiCommand>()
const apiCommandBuilderMock = jest.fn<typeof apiCommandBuilder>()
const apiDocsURLMock = jest.fn<typeof apiDocsURL>()
jest.unstable_mockModule('../../../lib/command/api-command.js', () => ({
	apiCommand: apiCommandMock,
	apiCommandBuilder: apiCommandBuilderMock,
	apiDocsURL: apiDocsURLMock,
}))

const stringTranslateToIdMock = jest.fn<typeof stringTranslateToId>()
jest.unstable_mockModule('../../../lib/command/command-util.js', () => ({
	stringTranslateToId: stringTranslateToIdMock,
}))

const selectFromListMock = jest.fn<typeof selectFromList>()
jest.unstable_mockModule('../../../lib/command/select.js', () => ({
	selectFromList: selectFromListMock,
}))

const chooseComponentMock = jest.fn<ChooseFunction<Component>>()
const chooseComponentFnMock = jest.fn<typeof chooseComponentFn>()
	.mockReturnValue(chooseComponentMock)
const chooseDeviceMock = jest.fn<ChooseFunction<Device>>().mockResolvedValue('chosen-device-id')
const prettyPrintAttributeMock = jest.fn<typeof prettyPrintAttribute>()
jest.unstable_mockModule('../../../lib/command/util/devices-util.js', () => ({
	chooseComponentFn: chooseComponentFnMock,
	chooseDevice: chooseDeviceMock,
	prettyPrintAttribute: prettyPrintAttributeMock,
}))

const formatAndWriteItemMock = jest.fn<typeof formatAndWriteItem<CapabilityStatus>>()
const formatAndWriteItemBuilderMock = jest.fn<typeof formatAndWriteItemBuilder>()
const formatAndWriteListMock = jest.fn<typeof formatAndWriteList<CapabilityStatus>>()
jest.unstable_mockModule('../../../lib/command/format.js', () => ({
	formatAndWriteItem: formatAndWriteItemMock,
	formatAndWriteItemBuilder: formatAndWriteItemBuilderMock,
	formatAndWriteList: formatAndWriteListMock,
}))

const fatalErrorMock = jest.fn<typeof fatalError>()
jest.unstable_mockModule('../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))


const {
	default: cmd,
	buildTableOutput,
} = await import('../../../commands/devices/capability-status.js')

test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		exampleMock,
		argvMock,
		epilogMock,
	} = buildArgvMock<SmartThingsCommandFlags, BuildOutputFormatterFlags>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	formatAndWriteItemBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(formatAndWriteItemBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(3)
	expect(exampleMock).toHaveBeenCalledOnce()
	expect(epilogMock).toHaveBeenCalledOnce()
})

test('buildTableOutput', () => {
	prettyPrintAttributeMock.mockReturnValueOnce('pretty value 1')
	prettyPrintAttributeMock.mockReturnValueOnce('pretty value 2')
	const capability: CapabilityStatus = {
		attribute1: { value: 'value of attribute 1' },
		attribute2: { value: 5 },
	}

	expect(buildTableOutput(tableGeneratorMock, capability)).toBe(mockedTableOutput)

	expect(newOutputTableMock).toHaveBeenCalledExactlyOnceWith({ head: ['Attribute', 'Value'] })
	expect(prettyPrintAttributeMock).toHaveBeenCalledTimes(2)
	expect(prettyPrintAttributeMock).toHaveBeenCalledWith(capability.attribute1)
	expect(prettyPrintAttributeMock).toHaveBeenCalledWith(capability.attribute2)
	expect(tablePushMock).toHaveBeenCalledTimes(2)
	expect(tablePushMock).toHaveBeenCalledWith(['attribute1', 'pretty value 1'])
	expect(tablePushMock).toHaveBeenCalledWith(['attribute2', 'pretty value 2'])
	expect(tableToStringMock).toHaveBeenCalledExactlyOnceWith()
})

describe('handler', () => {
	const device = {
		deviceId: 'device-id',
		components: [
			{ id: 'main', capabilities: [{ id: 'switch' }] },
			{ id: 'sans-capabilities' },
		],
	} as unknown as Device
	const capabilityStatus = { attribute: { value: 'attribute-value' } } as CapabilityStatus
	const apiDevicesGetMock = jest.fn<typeof DevicesEndpoint.prototype.get>()
		.mockResolvedValue(device)
	const apiDevicesGetCapabilityStatusMock = jest.fn<typeof DevicesEndpoint.prototype.getCapabilityStatus>()
		.mockResolvedValue(capabilityStatus)
	const command = {
		client: {
			devices: {
				get: apiDevicesGetMock,
				getCapabilityStatus: apiDevicesGetCapabilityStatusMock,
			},
		},
		tableGenerator: tableGeneratorMock,
	} as unknown as APICommand<CommandArgs>
	apiCommandMock.mockResolvedValue(command)
	const inputArgv = {
		deviceIdOrIndex: 'argv-id-or-index',
		componentId: 'argv-component-id',
		capabilityId: 'argv-capability-id',
		profile: 'default',
	} as ArgumentsCamelCase<CommandArgs>

	it('throws exception for component with no capabilities', async () => {
		chooseComponentMock.mockResolvedValueOnce('sans-capabilities')

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(chooseDeviceMock).toHaveBeenCalledExactlyOnceWith(
			command,
			'argv-id-or-index',
			{ allowIndex: true },
		)
		expect(apiDevicesGetMock).toHaveBeenCalledExactlyOnceWith('chosen-device-id')
		expect(chooseComponentFnMock).toHaveBeenCalledExactlyOnceWith(device)
		expect(chooseComponentMock).toHaveBeenCalledExactlyOnceWith(
			command,
			'argv-component-id',
			{ autoChoose: true },
		)

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith(
			'no capabilities found for component sans-capabilities of device chosen-device-id',
		)
		expect(formatAndWriteItemMock).not.toHaveBeenCalled()
	})

	it('calls formatAndWriteItem properly', async () => {
		chooseComponentMock.mockResolvedValueOnce('main')
		stringTranslateToIdMock.mockResolvedValueOnce('preselected-capability-id')
		selectFromListMock.mockResolvedValueOnce('chosen-capability-id')

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(chooseDeviceMock).toHaveBeenCalledExactlyOnceWith(
			command,
			'argv-id-or-index',
			{ allowIndex: true },
		)
		expect(apiDevicesGetMock).toHaveBeenCalledExactlyOnceWith('chosen-device-id')
		expect(chooseComponentFnMock).toHaveBeenCalledExactlyOnceWith(device)
		expect(chooseComponentMock).toHaveBeenCalledExactlyOnceWith(
			command,
			'argv-component-id',
			{ autoChoose: true },
		)
		expect(stringTranslateToIdMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ itemName: 'capability' }),
			'argv-capability-id',
			expect.any(Function),
		)
		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ itemName: 'capability' }),
			{ preselectedId: 'preselected-capability-id', listItems: expect.any(Function) },
		)
		expect(apiDevicesGetCapabilityStatusMock).toHaveBeenCalledExactlyOnceWith(
			'chosen-device-id',
			'main',
			'chosen-capability-id',
		)
		expect(formatAndWriteItemMock).toHaveBeenCalledExactlyOnceWith(
			command,
			{ buildTableOutput: expect.any(Function) },
			capabilityStatus,
		)

		expect(fatalErrorMock).not.toHaveBeenCalled()

		const config = formatAndWriteItemMock.mock.calls[0][1] as
			CustomCommonOutputProducer<CapabilityStatus>
		expect(config.buildTableOutput(capabilityStatus)).toBe(mockedTableOutput)

		const listItems = stringTranslateToIdMock.mock.calls[0][2]

		expect(await listItems()).toBe(device.components?.[0].capabilities)
	})
})
