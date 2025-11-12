import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { Rule } from '@smartthings/core-sdk'

import type { buildEpilog } from '../../lib/help.js'
import type { APICommand } from '../../lib/command/api-command.js'
import type { outputItemOrList, outputItemOrListBuilder } from '../../lib/command/listing-io.js'
import type { CommandArgs } from '../../commands/rules.js'
import type { BuildOutputFormatterFlags } from '../../lib/command/output-builder.js'
import type { SmartThingsCommandFlags } from '../../lib/command/smartthings-command.js'
import type { getRulesByLocation, getRuleWithLocation } from '../../lib/command/util/rules-util.js'
import { apiCommandMocks } from '../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../test-lib/builder-mock.js'
import { WithNamedLocation } from '../../lib/api-helpers.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../..')

const outputItemOrListMock = jest.fn<typeof outputItemOrList<Rule & WithNamedLocation>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))

const getRulesByLocationMock = jest.fn<typeof getRulesByLocation>()
const getRuleWithLocationMock = jest.fn<typeof getRuleWithLocation>()
jest.unstable_mockModule('../../lib/command/util/rules-util.js', () => ({
	getRulesByLocation: getRulesByLocationMock,
	getRuleWithLocation: getRuleWithLocationMock,
}))


const { default: cmd } = await import('../../commands/rules.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		optionMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, BuildOutputFormatterFlags>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputItemOrListBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const command = { client: { rules: {} } } as APICommand<CommandArgs>
	apiCommandMock.mockResolvedValue(command)

	const rule1 = { id: 'rule-id-1', name: 'rule-name-1' } as Rule
	const rule2 = { id: 'rule-id-2', name: 'rule-name-2' } as Rule
	const rules = [rule1, rule2]

	it('lists rules without args', async () => {
		const inputArgv = {
			location: 'argv-location',
			profile: 'default',
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'id' }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		const listItems = outputItemOrListMock.mock.calls[0][3]
		getRulesByLocationMock.mockResolvedValueOnce(rules)

		expect(await listItems()).toBe(rules)

		expect(getRulesByLocationMock).toHaveBeenCalledExactlyOnceWith(command.client, 'argv-location')
	})

	it('lists details of specified rule', async () => {
		const inputArgv = {
			idOrIndex: 'argv-rule-id-or-index',
			profile: 'default',
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)

		const getItem = outputItemOrListMock.mock.calls[0][4]
		getRuleWithLocationMock.mockResolvedValueOnce(rule1)

		expect(await getItem('input-rule-id')).toBe(rule1)

		expect(getRuleWithLocationMock).toHaveBeenCalledExactlyOnceWith(command.client, 'input-rule-id', undefined)
	})
})
