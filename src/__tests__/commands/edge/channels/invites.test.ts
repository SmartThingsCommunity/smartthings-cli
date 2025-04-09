import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { CommandArgs } from '../../../../commands/edge/channels/invites.js'
import type { APICommand, APICommandFlags } from '../../../../lib/command/api-command.js'
import { outputItemOrList, outputItemOrListBuilder } from '../../../../lib/command/listing-io.js'
import { listTableFieldDefinitions, tableFieldDefinitions } from '../../../../lib/command/util/edge-invites-table.js'
import { apiCommandMocks } from '../../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../../test-lib/builder-mock.js'
import { Invitation, InvitesEndpoint } from '../../../../lib/edge/endpoints/invites.js'
import type { edgeCommand, EdgeCommand } from '../../../../lib/command/edge-command.js'
import { buildListFunction } from '../../../../lib/command/util/edge-invites-util.js'


const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../../..')

const edgeCommandMock = jest.fn<typeof edgeCommand>()
jest.unstable_mockModule('../../../../lib/command/edge-command.js', () => ({
	edgeCommand: edgeCommandMock,
}))

const outputItemOrListMock = jest.fn<typeof outputItemOrList<Invitation>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))

const buildListFunctionMock = jest.fn<typeof buildListFunction>()
jest.unstable_mockModule('../../../../lib/command/util/edge-invites-util.js', () => ({
	buildListFunction: buildListFunctionMock,
}))


const { default: cmd } = await import('../../../../commands/edge/channels/invites.js')


test('builder', async () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		optionMock,
		exampleMock,
		argvMock,
	} = buildArgvMock<APICommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputItemOrListBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiInvitesGetMock = jest.fn<InvitesEndpoint['get']>()
	const command = { profileName: 'default' } as APICommand
	const edgeCommand = {
		edgeClient: {
			invites: {
				get: apiInvitesGetMock,
			},
		},
	} as unknown as EdgeCommand

	apiCommandMock.mockResolvedValueOnce(command)
	edgeCommandMock.mockReturnValueOnce(edgeCommand)
	const listFunctionMock = jest.fn<Parameters<typeof outputItemOrList<Invitation>>[3]>()
	buildListFunctionMock.mockReturnValueOnce(listFunctionMock)

	const inputArgv = {
		profile: 'default',
		channel: 'cmd-line-channel-id',
		idOrIndex: 'cmd-line-id',
	} as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(edgeCommandMock).toHaveBeenCalledExactlyOnceWith(command)
	expect(buildListFunctionMock).toHaveBeenCalledExactlyOnceWith(edgeCommand, 'cmd-line-channel-id')
	expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
		edgeCommand,
		expect.objectContaining({
			primaryKeyName: 'id',
			listTableFieldDefinitions,
			tableFieldDefinitions,
		}),
		'cmd-line-id',
		listFunctionMock,
		expect.any(Function),
	)

	const getFunction = outputItemOrListMock.mock.calls[0][4]
	const invite = { id: 'invitation-id' } as Invitation
	apiInvitesGetMock.mockResolvedValueOnce(invite)

	expect(await getFunction('invitation-id')).toBe(invite)
})
