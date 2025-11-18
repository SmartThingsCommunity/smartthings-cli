import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { EnrolledChannel, HubdevicesEndpoint } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../../commands/edge/channels/enrollments.js'
import type { buildEpilog } from '../../../../lib/help.js'
import type { APICommand, APICommandFlags } from '../../../../lib/command/api-command.js'
import type { outputList, outputListBuilder } from '../../../../lib/command/output-list.js'
import type { chooseHub } from '../../../../lib/command/util/hubs-choose.js'
import { apiCommandMocks } from '../../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../../..')

const outputListMock = jest.fn<typeof outputList>()
const outputListBuilderMock = jest.fn<typeof outputListBuilder>()
jest.unstable_mockModule('../../../../lib/command/output-list.js', () => ({
	outputList: outputListMock,
	outputListBuilder: outputListBuilderMock,
}))

const chooseHubMock = jest.fn<typeof chooseHub>()
jest.unstable_mockModule('../../../../lib/command/util/hubs-choose.js', () => ({
	chooseHub: chooseHubMock,
}))


const { default: cmd } = await import('../../../../commands/edge/channels/enrollments.js')


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
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiHubDevicesEnrolledChannelsMock = jest.fn<typeof HubdevicesEndpoint.prototype.enrolledChannels>()
	const command = {
		client:
		{
			hubdevices: {
				enrolledChannels: apiHubDevicesEnrolledChannelsMock,
			},
		},
	} as unknown as APICommand
	apiCommandMock.mockResolvedValueOnce(command)
	chooseHubMock.mockResolvedValueOnce('chosen-hub-id')

	const inputArgv = {
		profile: 'default',
		idOrIndex: 'cmd-line-id',
	} as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseHubMock).toHaveBeenCalledExactlyOnceWith(
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
	const channels = [{ channelId: 'channel-id' } as EnrolledChannel]
	apiHubDevicesEnrolledChannelsMock.mockResolvedValueOnce(channels)

	expect(await listFunction()).toBe(channels)
})
