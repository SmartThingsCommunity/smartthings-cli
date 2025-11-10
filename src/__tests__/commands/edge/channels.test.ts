import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv, Options } from 'yargs'

import type { Channel, ChannelsEndpoint } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/edge/channels.js'
import type { WithOrganization } from '../../../lib/api-helpers.js'
import type { buildEpilog } from '../../../lib/help.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../../lib/command/api-organization-command.js'
import type {
	AllOrganizationFlags,
	allOrganizationsBuilder,
} from '../../../lib/command/common-flags.js'
import type { outputItemOrList, outputItemOrListBuilder } from '../../../lib/command/listing-io.js'
import { listChannels } from '../../../lib/command/util/edge/channels.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const apiOrganizationCommandMock = jest.fn<typeof apiOrganizationCommand>()
const apiOrganizationCommandBuilderMock = jest.fn<typeof apiOrganizationCommandBuilder>()
jest.unstable_mockModule('../../../lib/command/api-organization-command.js', () => ({
	apiOrganizationCommand: apiOrganizationCommandMock,
	apiOrganizationCommandBuilder: apiOrganizationCommandBuilderMock,
}))

const allOrganizationsBuilderMock = jest.fn<typeof allOrganizationsBuilder>()
jest.unstable_mockModule('../../../lib/command/common-flags.js', () => ({
	allOrganizationsBuilder: allOrganizationsBuilderMock,
}))

const outputItemOrListMock =
	jest.fn<typeof outputItemOrList<Channel & WithOrganization>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))

const listChannelsMock = jest.fn<typeof listChannels>()
jest.unstable_mockModule('../../../lib/command/util/edge/channels.js', () => ({
	listChannels: listChannelsMock,
}))


const { default: cmd } = await import('../../../commands/edge/channels.js')


describe('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const apiOrganizationCommandBuilderArgvMock = buildArgvMockStub<APIOrganizationCommandFlags>()
	const {
		yargsMock: allOrganizationsBuilderArgvMock,
		optionMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APIOrganizationCommandFlags & AllOrganizationFlags, CommandArgs>()

	apiOrganizationCommandBuilderMock.mockReturnValue(apiOrganizationCommandBuilderArgvMock)
	allOrganizationsBuilderMock.mockReturnValue(allOrganizationsBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	it('calls correct parent and yargs functions', () => {
		expect(builder(yargsMock)).toBe(argvMock)

		expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
		expect(allOrganizationsBuilderMock)
			.toHaveBeenCalledExactlyOnceWith(apiOrganizationCommandBuilderArgvMock)
		expect(outputItemOrListBuilderMock)
			.toHaveBeenCalledExactlyOnceWith(allOrganizationsBuilderArgvMock)

		expect(optionMock).toHaveBeenCalledTimes(3)
		expect(positionalMock).toHaveBeenCalledTimes(2)
		expect(exampleMock).toHaveBeenCalledTimes(1)
		expect(buildEpilogMock).toHaveBeenCalledTimes(1)
		expect(epilogMock).toHaveBeenCalledTimes(1)
	})

	it('accepts upper and lowercase subscriber types', () => {
		// A simplified version of the type of the `Argv.option` that matches the way we call it.
		type OptionMock = jest.Mock<(key: string, options?: Options) => Argv<object & APIOrganizationCommandFlags>>

		expect(builder(yargsMock)).toBe(argvMock)

		const typeCoerce = (optionMock as OptionMock).mock.calls[1][1]?.coerce
		expect(typeCoerce).toBeDefined()
		expect(typeCoerce?.('hub')).toStrictEqual('HUB')
	})
})

describe('handler', () => {
	const apiChannelsGetMock = jest.fn<typeof ChannelsEndpoint.prototype.get>()
	const command = {
		client: {
			channels: {
				get: apiChannelsGetMock,
			},
		},
	} as unknown as APIOrganizationCommand<ArgumentsCamelCase<CommandArgs>>
	apiOrganizationCommandMock.mockResolvedValue(command)
	const defaultInputArgv = {
		profile: 'default',
	} as ArgumentsCamelCase<CommandArgs>

	const channel1 = { channelId: 'channel-id-1' } as Channel
	const channel2 = { channelId: 'channel-id-2' } as Channel
	const channels = [channel1, channel2]

	it('lists channels without args', async () => {
		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(defaultInputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				primaryKeyName: 'channelId',
				listTableFieldDefinitions: expect.not.arrayContaining(['organization']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		listChannelsMock.mockResolvedValueOnce(channels)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(channels)

		expect(listChannelsMock).toHaveBeenCalledExactlyOnceWith(
			command.client,
			{
				allOrganizations: undefined,
				subscriberType: undefined,
				subscriberId: undefined,
				includeReadOnly: undefined,
			},
		)
	})

	it('includes all organizations when requested', async () => {
		await expect(cmd.handler({
			...defaultInputArgv,
			allOrganizations: true,
		})).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				listTableFieldDefinitions: expect.arrayContaining(['organization']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		listChannelsMock.mockResolvedValueOnce(channels)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(channels)

		expect(listChannelsMock).toHaveBeenCalledExactlyOnceWith(
			command.client,
			{
				allOrganizations: true,
			},
		)
	})

	it('includes subscriber type and id when included', async () => {
		await expect(cmd.handler({
			...defaultInputArgv,
			subscriberType: 'subscriber-type',
			subscriberId: 'subscriber-id',
		})).resolves.not.toThrow()

		listChannelsMock.mockResolvedValueOnce(channels)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(channels)

		expect(listChannelsMock).toHaveBeenCalledExactlyOnceWith(
			command.client,
			{
				subscriberType: 'subscriber-type',
				subscriberId: 'subscriber-id',
			},
		)
	})

	it('defaults subscriber-type to HUB', async () => {
		await expect(cmd.handler({
			...defaultInputArgv,
			subscriberId: 'subscriber-id',
		})).resolves.not.toThrow()

		listChannelsMock.mockResolvedValueOnce(channels)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(channels)

		expect(listChannelsMock).toHaveBeenCalledExactlyOnceWith(
			command.client,
			{
				subscriberType: 'HUB',
				subscriberId: 'subscriber-id',
			},
		)
	})

	it('includes ready-only channels when requested', async () => {
		await expect(cmd.handler({
			...defaultInputArgv,
			includeReadOnly: true,
		})).resolves.not.toThrow()

		listChannelsMock.mockResolvedValueOnce(channels)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(channels)

		expect(listChannelsMock).toHaveBeenCalledExactlyOnceWith(
			command.client,
			{
				includeReadOnly: true,
			},
		)
	})

	it('lists details of a specified channel', async () => {
		const inputArgv = { ...defaultInputArgv, idOrIndex: 'cmd-line-id' }

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'channelId' }),
			'cmd-line-id',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]
		apiChannelsGetMock.mockResolvedValue(channel1)

		expect(await getFunction('chosen-driver-id')).toStrictEqual(channel1)

		expect(apiChannelsGetMock).toHaveBeenCalledExactlyOnceWith('chosen-driver-id')
	})
})
