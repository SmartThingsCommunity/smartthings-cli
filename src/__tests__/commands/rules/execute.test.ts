import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { RulesEndpoint, RuleExecutionResponse, Rule } from '@smartthings/core-sdk'

import type { chooseRuleFn } from '../../../lib/command/util/rules-choose.js'
import type { buildExecuteResponseTableOutput } from '../../../lib/command/util/rules-table.js'
import type { getRuleWithLocation } from '../../../lib/command/util/rules-util.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'
import { CustomCommonOutputProducer, formatAndWriteItem, formatAndWriteItemBuilder } from '../../../lib/command/format.js'
import { CommandArgs } from '../../../commands/rules/execute.js'
import { APICommand, APICommandFlags } from '../../../lib/command/api-command.js'
import { WithLocation } from '../../../lib/api-helpers.js'
import { ChooseFunction } from '../../../lib/command/util/util-util.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { tableGeneratorMock } from '../../test-lib/table-mock.js'


const { apiCommandMock, apiCommandBuilderMock, apiDocsURLMock } = apiCommandMocks('../../..')

const formatAndWriteItemMock = jest.fn<typeof formatAndWriteItem<RuleExecutionResponse>>()
const formatAndWriteItemBuilderMock = jest.fn<typeof formatAndWriteItemBuilder>()
jest.unstable_mockModule('../../../lib/command/format.js', () => ({
	formatAndWriteItem: formatAndWriteItemMock,
	formatAndWriteItemBuilder: formatAndWriteItemBuilderMock,
}))

const chooseRuleFnMock = jest.fn<typeof chooseRuleFn>()
jest.unstable_mockModule('../../../lib/command/util/rules-choose.js', () => ({
	chooseRuleFn: chooseRuleFnMock,
}))

const buildExecuteResponseTableOutputMock = jest.fn<typeof buildExecuteResponseTableOutput>()
jest.unstable_mockModule('../../../lib/command/util/rules-table.js', () => ({
	buildExecuteResponseTableOutput: buildExecuteResponseTableOutputMock,
}))

const getRuleWithLocationMock = jest.fn<typeof getRuleWithLocation>()
jest.unstable_mockModule('../../../lib/command/util/rules-util.js', () => ({
	getRuleWithLocation: getRuleWithLocationMock,
}))


const { default: cmd } = await import('../../../commands/rules/execute.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<CommandArgs, APICommandFlags>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	formatAndWriteItemBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(formatAndWriteItemBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledOnce()
	expect(exampleMock).toHaveBeenCalledOnce()
	expect(apiDocsURLMock).toHaveBeenCalledOnce()
	expect(epilogMock).toHaveBeenCalledOnce()
})

describe('handler', () => {
	const executionResponse = { executionId: 'execution-response-id' } as RuleExecutionResponse
	const apiRulesExecuteMock = jest.fn<typeof RulesEndpoint.prototype.execute>()
		.mockResolvedValue(executionResponse)

	const command = {
		client: {
			rules: {
				execute: apiRulesExecuteMock,
			},
		},
		tableGenerator: tableGeneratorMock,
	} as unknown as APICommand<CommandArgs>
	apiCommandMock.mockResolvedValue(command)

	const chooseRuleMock = jest.fn<ChooseFunction<Rule & WithLocation>>()
		.mockResolvedValue('chosen-rule-id')
	chooseRuleFnMock.mockReturnValue(chooseRuleMock)

	const baseInputArgv = {
		profile: 'default',
		id: 'cmd-line-id',
	} as ArgumentsCamelCase<CommandArgs>

	it('finds and executes a rule without a location', async () => {
		getRuleWithLocationMock.mockResolvedValueOnce({ locationId: 'discovered-location-id' } as Rule & WithLocation)

		await expect(cmd.handler(baseInputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(baseInputArgv)
		expect(chooseRuleFnMock).toHaveBeenCalledExactlyOnceWith(undefined)
		expect(chooseRuleMock).toHaveBeenCalledExactlyOnceWith(
			command,
			'cmd-line-id',
			{ promptMessage: 'Select a rule to execute.' },
		)
		expect(getRuleWithLocationMock).toHaveBeenCalledExactlyOnceWith(command.client, 'chosen-rule-id', undefined)
		expect(apiRulesExecuteMock).toHaveBeenCalledExactlyOnceWith('chosen-rule-id', 'discovered-location-id')
		expect(formatAndWriteItemMock).toHaveBeenCalledExactlyOnceWith(
			command,
			{ buildTableOutput: expect.any(Function) },
			executionResponse,
		)


		const config = formatAndWriteItemMock.mock.calls[0][1] as CustomCommonOutputProducer<RuleExecutionResponse>
		buildExecuteResponseTableOutputMock.mockReturnValueOnce('table output')

		expect(config.buildTableOutput(executionResponse)).toBe('table output')

		expect(buildExecuteResponseTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, executionResponse)
	})

	it('uses location specified on command line', async () => {
		getRuleWithLocationMock.mockResolvedValueOnce({ locationId: 'discovered-location-id' } as Rule & WithLocation)

		await expect(cmd.handler({ ...baseInputArgv, location: 'cmd-line-location-id' })).resolves.not.toThrow()

		expect(getRuleWithLocationMock).not.toHaveBeenCalled()
		expect(apiRulesExecuteMock).toHaveBeenCalledExactlyOnceWith('chosen-rule-id', 'cmd-line-location-id')
	})
})
