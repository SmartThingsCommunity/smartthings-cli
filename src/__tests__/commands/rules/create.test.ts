import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import { Rule, RuleRequest, RulesEndpoint } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/locations/create.js'
import type { buildEpilog } from '../../../lib/help.js'
import type { APICommand, APICommandFlags } from '../../../lib/command/api-command.js'
import type { inputAndOutputItem, inputAndOutputItemBuilder } from '../../../lib/command/input-and-output-item.js'
import type { chooseLocation } from '../../../lib/command/util/locations-util.js'
import { tableFieldDefinitions } from '../../../lib/command/util/rules-table.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../..')

const inputAndOutputItemMock = jest.fn<typeof inputAndOutputItem>()
const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../lib/command/input-and-output-item.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))

const chooseLocationMock = jest.fn<typeof chooseLocation>()
jest.unstable_mockModule('../../../lib/command/util/locations-util.js', () => ({
	chooseLocation: chooseLocationMock,
}))


const { default: cmd } = await import('../../../commands/rules/create.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
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

	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiRulesCreateMock = jest.fn<typeof RulesEndpoint.prototype.create>()
	const command = {
		client: {
			rules: {
				create: apiRulesCreateMock,
			},
		},
	} as unknown as APICommand<ArgumentsCamelCase<CommandArgs>>
	apiCommandMock.mockResolvedValueOnce(command)
	chooseLocationMock.mockResolvedValueOnce('chosen-location-id')

	const inputArgv = {
		profile: 'default',
		location: 'argv-location-id',
	} as unknown as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseLocationMock).toHaveBeenCalledExactlyOnceWith(command, 'argv-location-id')
	expect(inputAndOutputItemMock).toHaveBeenCalledExactlyOnceWith(
		command,
		{ tableFieldDefinitions },
		expect.any(Function),
	)

	const createFunction = inputAndOutputItemMock.mock.calls[0][2]
	const request = { name: 'Rule Name' } as RuleRequest
	const created = { name: 'Created Rule' } as Rule
	apiRulesCreateMock.mockResolvedValueOnce(created)

	expect(await createFunction(undefined, request)).toBe(created)

	expect(apiRulesCreateMock).toHaveBeenCalledExactlyOnceWith(request, 'chosen-location-id')
})
