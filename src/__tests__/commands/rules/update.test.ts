import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { Rule, RuleRequest, RulesEndpoint } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/rules/update.js'
import type { WithLocation } from '../../../lib/api-helpers.js'
import type { APICommand, APICommandFlags } from '../../../lib/command/api-command.js'
import type { inputAndOutputItem, inputAndOutputItemBuilder } from '../../../lib/command/input-and-output-item.js'
import type { chooseRuleFn } from '../../../lib/command/util/rules-choose.js'
import { tableFieldDefinitions } from '../../../lib/command/util/rules-table.js'
import type { getRuleWithLocation } from '../../../lib/command/util/rules-util.js'
import type { ChooseFunction } from '../../../lib/command/util/util-util.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'


const { apiCommandMock, apiCommandBuilderMock, apiDocsURLMock } = apiCommandMocks('../../..')

const inputAndOutputItemMock = jest.fn<typeof inputAndOutputItem<RuleRequest, Rule>>()
const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../lib/command/input-and-output-item.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))

const chooseRuleMock = jest.fn<ChooseFunction<Rule>>()
const chooseRuleFnMock = jest.fn<typeof chooseRuleFn>().mockReturnValue(chooseRuleMock)
jest.unstable_mockModule('../../../lib/command/util/rules-choose.js', () => ({
	chooseRuleFn: chooseRuleFnMock,
}))

const getRuleWithLocationMock = jest.fn<typeof getRuleWithLocation>()
jest.unstable_mockModule('../../../lib/command/util/rules-util.js', () => ({
	getRuleWithLocation: getRuleWithLocationMock,
}))


const { default: cmd } = await import('../../../commands/rules/update.js')


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

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiRulesUpdateMock = jest.fn<typeof RulesEndpoint.prototype.update>()
	chooseRuleMock.mockResolvedValue('chosen-rule-id')
	const command = {
		client: {
			rules: {
				update: apiRulesUpdateMock,
			},
		},
	} as unknown as APICommand<ArgumentsCamelCase<CommandArgs>>
	apiCommandMock.mockResolvedValue(command)

	const inputArgv = {
		profile: 'default',
		id: 'cmd-line-id',
		location: 'cmd-line-location-id',
	} as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseRuleFnMock).toHaveBeenCalledExactlyOnceWith('cmd-line-location-id')
	expect(chooseRuleMock).toHaveBeenCalledExactlyOnceWith(
		command,
		'cmd-line-id',
		{ promptMessage: 'Select a rule to update.' },
	)
	expect(inputAndOutputItemMock).toHaveBeenCalledExactlyOnceWith(
		command,
		{ tableFieldDefinitions },
		expect.any(Function),
	)

	const executeAction = inputAndOutputItemMock.mock.calls[0][2]

	const rule = { id: 'rule-to-update', locationId: 'rule-location-id' } as Rule & WithLocation
	const updatedRule = { id: 'updated-rule' } as Rule
	getRuleWithLocationMock.mockResolvedValueOnce(rule)
	apiRulesUpdateMock.mockResolvedValueOnce(updatedRule)

	expect(await executeAction(undefined, rule)).toBe(updatedRule)

	expect(getRuleWithLocationMock).toHaveBeenCalledExactlyOnceWith(
		command.client,
		'chosen-rule-id',
		'cmd-line-location-id',
	)
	expect(apiRulesUpdateMock).toHaveBeenCalledExactlyOnceWith('chosen-rule-id', rule, 'rule-location-id')
})
