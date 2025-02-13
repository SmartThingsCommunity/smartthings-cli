import type { ActionExecutionResult, Rule, RuleAction, RuleExecutionResponse } from '@smartthings/core-sdk'

import {
	buildTableFromItemMock,
	buildTableFromListMock,
	mockedItemTableOutput,
	mockedListTableOutput,
	tableGeneratorMock,
} from '../../../test-lib/table-mock.js'
import { ValueTableFieldDefinition } from '../../../../lib/table-generator.js'


const {
	buildExecuteResponseTableOutput,
	tableFieldDefinitions,
} = await import('../../../../lib/command/util/rules-table.js')


test('tableFieldDefinitions counts rule actions', () => {
	const numActionsDefinition = tableFieldDefinitions[2] as { value: (rule: Rule) => string }
	const rule = { actions: [1, 2, 3] as unknown as RuleAction[] } as Rule
	expect(numActionsDefinition.value(rule)).toBe('3')
})

describe('buildExecuteResponseTableOutput', () => {
	const executeResponse = {
		id: 'execute-response-id',
		actions: [{ actionId: 'action-id' }],
	} as RuleExecutionResponse

	it('includes actions when present', () => {
		expect(buildExecuteResponseTableOutput(tableGeneratorMock, executeResponse))
			.toBe(`${mockedItemTableOutput}\n\nActions\n${mockedListTableOutput}`)

		expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromItemMock).toHaveBeenCalledWith(executeResponse, ['executionId', 'id', 'result'])
		expect(buildTableFromListMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromListMock).toHaveBeenCalledWith(executeResponse.actions,
			expect.arrayContaining(['actionId', { path: 'location.locationId' }]))
	})

	it('leaves out actions table when there are no actions', () => {
		const executeResponse = { id: 'execute-response-id' } as RuleExecutionResponse

		expect(buildExecuteResponseTableOutput(tableGeneratorMock, executeResponse)).toBe(mockedItemTableOutput)

		expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromItemMock).toHaveBeenCalledWith(executeResponse,
			['executionId', 'id', 'result'])
		expect(buildTableFromListMock).toHaveBeenCalledTimes(0)
	})

	type ActionRuleTestSet = {
		action: ActionExecutionResult
		expected: string | undefined
	}
	const ruleActionTests: ActionRuleTestSet[] = [
		{ action: { actionId: 'id', if: { result: 'True' } }, expected: 'True' },
		{ action: { actionId: 'id', location: { result: 'Success', locationId: 'location-id' } }, expected: 'Success' },
		{ action: { actionId: 'id', command: [{ result: 'Failure', deviceId: 'device-id' }] }, expected: '1' },
		{ action: { actionId: 'id', sleep: { result: 'Ignored' } }, expected: 'Ignored' },
		{ action: { actionId: 'id' }, expected: '' },
	]
	test.each(ruleActionTests)('displays action result of $action as $expected', ({ action, expected }) => {
		buildExecuteResponseTableOutput(tableGeneratorMock, executeResponse)
		const calculateResult =
			(buildTableFromListMock.mock.calls[0][1][1] as ValueTableFieldDefinition<ActionExecutionResult>).value

		expect(calculateResult(action)).toBe(expected)
	})
})
