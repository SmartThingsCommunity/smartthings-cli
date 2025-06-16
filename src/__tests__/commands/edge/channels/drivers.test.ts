import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { CommandArgs } from '../../../../commands/edge/channels/drivers.js'
import type { APICommand, APICommandFlags } from '../../../../lib/command/api-command.js'
import type { outputList, outputListBuilder } from '../../../../lib/command/output-list.js'
import type {
	DriverChannelDetailsWithName,
	listAssignedDriversWithNames,
} from '../../../../lib/command/util/edge-drivers.js'
import type { ChooseFunction } from '../../../../lib/command/util/util-util.js'
import type { ChannelChoice, chooseChannelFn } from '../../../../lib/command/util/edge/channels-choose.js'
import { apiCommandMocks } from '../../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../../test-lib/builder-mock.js'


const { apiCommandMock, apiCommandBuilderMock, apiDocsURLMock } = apiCommandMocks('../../../..')

const outputListMock = jest.fn<typeof outputList>()
const outputListBuilderMock = jest.fn<typeof outputListBuilder>()
jest.unstable_mockModule('../../../../lib/command/output-list.js', () => ({
	outputList: outputListMock,
	outputListBuilder: outputListBuilderMock,
}))

const listAssignedDriversWithNamesMock = jest.fn<typeof listAssignedDriversWithNames>()
jest.unstable_mockModule('../../../../lib/command/util/edge-drivers.js', () => ({
	listAssignedDriversWithNames: listAssignedDriversWithNamesMock,
}))

const chooseChannelMock = jest.fn<ChooseFunction<ChannelChoice>>()
const chooseChannelFnMock = jest.fn<typeof chooseChannelFn>().mockReturnValue(chooseChannelMock)
jest.unstable_mockModule('../../../../lib/command/util/edge/channels-choose.js', () => ({
	chooseChannelFn: chooseChannelFnMock,
}))


const { default: cmd } = await import('../../../../commands/edge/channels/drivers.js')


test('builder', async () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		optionMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APICommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	outputListBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputListBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(0)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const command = { client: { not: 'empty' } } as unknown as APICommand
	apiCommandMock.mockResolvedValueOnce(command)
	chooseChannelMock.mockResolvedValueOnce('chosen-channel-id')

	const inputArgv = {
		profile: 'default',
		idOrIndex: 'cmd-line-id',
	} as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseChannelFnMock).toHaveBeenCalledExactlyOnceWith({ includeReadOnly: true })
	expect(chooseChannelMock).toHaveBeenCalledExactlyOnceWith(
		command,
		'cmd-line-id',
		{ allowIndex: true, useConfigDefault: true },
	)
	expect(outputListMock).toHaveBeenCalledExactlyOnceWith(
		command,
		expect.objectContaining({ primaryKeyName: 'channelId' }),
		expect.any(Function),
	)

	const listFunction = outputListMock.mock.calls[0][2]
	const drivers = [{ driverId: 'driver-id' } as DriverChannelDetailsWithName]
	listAssignedDriversWithNamesMock.mockResolvedValueOnce(drivers)

	expect(await listFunction()).toBe(drivers)
})
