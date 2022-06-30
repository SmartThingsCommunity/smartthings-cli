import { RulesEndpoint, RuleExecutionResponse, SmartThingsClient } from '@smartthings/core-sdk'

import { CustomCommonOutputProducer, DefaultTableGenerator, formatAndWriteItem } from '@smartthings/cli-lib'

import RulesExecuteCommand from '../../../commands/rules/execute'
import { buildExecuteResponseTableOutput, chooseRule, getRuleWithLocation, RuleWithLocation }
	from '../../../lib/commands/rules-util'


jest.mock('../../../lib/commands/rules-util')

describe('RulesExecuteCommand', () => {
	const ruleWithLocation = { locationId: 'location-id' } as RuleWithLocation
	const chooseRuleMock = jest.mocked(chooseRule)
	const getRuleWithLocationMock = jest.mocked(getRuleWithLocation).mockResolvedValue(ruleWithLocation)
	const buildExecuteResponseTableOutputMock = jest.mocked(buildExecuteResponseTableOutput)
	const formatAndWriteItemMock = jest.mocked(formatAndWriteItem).mockImplementation()
	const executeResponse = { id: 'execute-response-id' } as RuleExecutionResponse
	const executeSpy = jest.spyOn(RulesEndpoint.prototype, 'execute').mockResolvedValue(executeResponse)

	it('allows user to select rule', async () => {
		chooseRuleMock.mockResolvedValueOnce('chosen-rule-id')
		getRuleWithLocationMock.mockResolvedValue(ruleWithLocation)

		await expect(RulesExecuteCommand.run([])).resolves.not.toThrow()

		expect(chooseRuleMock).toHaveBeenCalledTimes(1)
		expect(chooseRuleMock).toHaveBeenCalledWith(expect.any(RulesExecuteCommand),
			'Select a rule to execute.', undefined, undefined)
		expect(getRuleWithLocationMock).toHaveBeenCalledTimes(1)
		expect(getRuleWithLocationMock).toHaveBeenCalledWith(expect.any(SmartThingsClient),
			'chosen-rule-id', undefined)

		expect(executeSpy).toHaveBeenCalledTimes(1)
		expect(executeSpy).toHaveBeenCalledWith('chosen-rule-id', 'location-id')

		expect(formatAndWriteItemMock).toHaveBeenCalledTimes(1)
		expect(formatAndWriteItemMock).toHaveBeenCalledWith(expect.any(RulesExecuteCommand),
			expect.objectContaining({}), executeResponse)

		const config = formatAndWriteItemMock.mock.calls[0][1] as CustomCommonOutputProducer<RuleExecutionResponse>

		const tableOutput = 'table output'
		buildExecuteResponseTableOutputMock.mockReturnValueOnce(tableOutput)

		expect(config.buildTableOutput(executeResponse)).toBe(tableOutput)

		expect(buildExecuteResponseTableOutputMock).toHaveBeenCalledTimes(1)
		expect(buildExecuteResponseTableOutputMock)
			.toHaveBeenCalledWith(expect.any(DefaultTableGenerator), executeResponse)
	})

	it('use rule id from command line', async () => {
		chooseRuleMock.mockResolvedValueOnce('chosen-rule-id')
		getRuleWithLocationMock.mockResolvedValue(ruleWithLocation)

		await expect(RulesExecuteCommand.run(['cmd-line-rule-id'])).resolves.not.toThrow()

		expect(chooseRuleMock).toHaveBeenCalledTimes(1)
		expect(chooseRuleMock).toHaveBeenCalledWith(expect.any(RulesExecuteCommand),
			'Select a rule to execute.', undefined, 'cmd-line-rule-id')
		expect(getRuleWithLocationMock).toHaveBeenCalledTimes(1)
		expect(getRuleWithLocationMock).toHaveBeenCalledWith(expect.any(SmartThingsClient),
			'chosen-rule-id', undefined)
		expect(executeSpy).toHaveBeenCalledTimes(1)
		expect(executeSpy).toHaveBeenCalledWith('chosen-rule-id', 'location-id')
	})

	it('uses location from command line', async () => {
		chooseRuleMock.mockResolvedValueOnce('chosen-rule-id')
		getRuleWithLocationMock.mockResolvedValue(ruleWithLocation)

		await expect(RulesExecuteCommand.run(['--location-id', 'cmd-line-location-id'])).resolves.not.toThrow()

		expect(chooseRuleMock).toHaveBeenCalledTimes(1)
		expect(chooseRuleMock).toHaveBeenCalledWith(expect.any(RulesExecuteCommand),
			'Select a rule to execute.', 'cmd-line-location-id', undefined)
		expect(getRuleWithLocationMock).toHaveBeenCalledTimes(0)
		expect(executeSpy).toHaveBeenCalledTimes(1)
		expect(executeSpy).toHaveBeenCalledWith('chosen-rule-id', 'cmd-line-location-id')
	})
})
