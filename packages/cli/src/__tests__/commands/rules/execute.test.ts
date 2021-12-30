import { ExecuteResponse, RulesEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { APICommand, CommonOutputProducer, CustomCommonOutputProducer, DefaultTableGenerator,
	formatAndWriteItem, IOFormat, SmartThingsCommandInterface,  TableGenerator}
	from '@smartthings/cli-lib'

import RulesExecuteCommand from '../../../commands/rules/execute'
import { buildExecuteResponseTableOutput, chooseRule, getRuleWithLocation, RuleWithLocation }
	from '../../../lib/commands/rules/rules-util'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		formatAndWriteItem: jest.fn(),
	}
})

jest.mock('../../../lib/commands/rules/rules-util')

describe('RulesExecuteCommand', () => {
	const ruleWithLocation = { locationId: 'location-id' } as RuleWithLocation
	const chooseRuleMock = chooseRule as unknown as
		jest.Mock<Promise<string>, [APICommand, string, string | undefined, string | undefined]>
	const getRuleWithLocationMock = (getRuleWithLocation as
			jest.Mock<Promise<RuleWithLocation>, [SmartThingsClient, string, string | undefined]>)
		.mockResolvedValue(ruleWithLocation)
	const buildExecuteResponseTableOutputMock = buildExecuteResponseTableOutput as
		jest.Mock<string, [TableGenerator, ExecuteResponse]>

	const formatAndWriteItemMock = (formatAndWriteItem as unknown as
		jest.Mock<Promise<void>, [SmartThingsCommandInterface, CommonOutputProducer<ExecuteResponse>, ExecuteResponse, IOFormat | undefined]>)
		.mockImplementation()
	const executeResponse = { id: 'execute-response-id' } as ExecuteResponse
	const executeSpy = jest.spyOn(RulesEndpoint.prototype, 'execute').mockResolvedValue(executeResponse)

	afterEach(() => {
		jest.clearAllMocks()
	})

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

		const config = formatAndWriteItemMock.mock.calls[0][1] as CustomCommonOutputProducer<ExecuteResponse>

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
