import { type ActionExecutionResult, type RuleExecutionResponse, type Rule } from '@smartthings/core-sdk'

import { type TableGenerator, type TableFieldDefinition } from '../../table-generator.js'


export const tableFieldDefinitions: TableFieldDefinition<Rule>[] = ['name', 'id',
	{ label: 'Num Actions', value: rule => rule.actions.length.toString() },
	'timeZoneId']

export const buildExecuteResponseTableOutput = (
		tableGenerator: TableGenerator,
		executeResponse: RuleExecutionResponse,
): string => {
	const mainInfo = tableGenerator.buildTableFromItem(executeResponse, ['executionId', 'id', 'result'])
	const calculateResult = (action: ActionExecutionResult): string =>
		action.if?.result ?? action.location?.result ?? action.command?.length.toString() ?? action.sleep?.result ?? ''
	const actionsInfoTableDefinitions: TableFieldDefinition<ActionExecutionResult>[] = [
		'actionId',
		{ label: 'Result', value: calculateResult },
		{ path: 'location.locationId' },
		{ path: 'command.deviceId' },
	]
	const actionsInfo = executeResponse.actions
		? tableGenerator.buildTableFromList(executeResponse.actions, actionsInfoTableDefinitions)
		: undefined

	return `${mainInfo}${actionsInfo ? `\n\nActions\n${actionsInfo}` : ''}`
}
