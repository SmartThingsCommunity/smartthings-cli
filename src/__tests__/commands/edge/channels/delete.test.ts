import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import { ChannelsEndpoint } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../../commands/edge/channels/delete.js'
import type { APICommand, APICommandFlags } from '../../../../lib/command/api-command.js'
import type { CLIConfig, resetManagedConfigKey } from '../../../../lib/cli-config.js'
import type { chooseChannel } from '../../../../lib/command/util/edge/channels-choose.js'
import { apiCommandMocks } from '../../../test-lib/api-command-mock.js'
import { buildArgvMock } from '../../../test-lib/builder-mock.js'


const resetManagedConfigKeyMock = jest.fn<typeof resetManagedConfigKey>()
jest.unstable_mockModule('../../../../lib/cli-config.js', () => ({
	resetManagedConfigKey: resetManagedConfigKeyMock,
}))

const { apiCommandMock, apiCommandBuilderMock, apiDocsURLMock } = apiCommandMocks('../../../..')

const chooseChannelMock = jest.fn<typeof chooseChannel>().mockResolvedValue('chosen-channel-id')
jest.unstable_mockModule('../../../../lib/command/util/edge/channels-choose.js', () => ({
	chooseChannel: chooseChannelMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /* do nothing */ })


const { default: cmd } = await import('../../../../commands/edge/channels/delete.js')


test('builder', () => {
	const {
		yargsMock,
		positionalMock,
		optionMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APICommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(0)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const cliConfig = { profile: {} } as CLIConfig
	const inputArgv = {
		profile: 'default',
		id: 'cmd-line-id',
	} as ArgumentsCamelCase<CommandArgs>
	const apiChannelsDeleteMock = jest.fn<typeof ChannelsEndpoint.prototype.delete>()
	const command = {
		client: {
			channels: {
				delete: apiChannelsDeleteMock,
			},
		},
		cliConfig,
	} as unknown as APICommand
	apiCommandMock.mockResolvedValueOnce(command)

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseChannelMock).toHaveBeenCalledExactlyOnceWith(
		command,
		'cmd-line-id',
		{ promptMessage: 'Choose a channel to delete.' },
	)
	expect(apiChannelsDeleteMock).toHaveBeenCalledExactlyOnceWith('chosen-channel-id')
	expect(resetManagedConfigKeyMock).toHaveBeenCalledExactlyOnceWith(cliConfig, 'defaultChannel', expect.any(Function))
	expect(consoleLogSpy).toHaveBeenCalledWith('Channel chosen-channel-id deleted.')

	const resetPredicate = resetManagedConfigKeyMock.mock.calls[0][2]

	expect(resetPredicate?.('chosen-channel-id')).toBe(true)
	expect(resetPredicate?.('different-channel-id')).toBe(false)
})
