import { Rule, RuleRequest, RulesEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { ActionFunction, APICommand, CommonOutputProducer, inputAndOutputItem, SmartThingsCommandInterface }
	from '@smartthings/cli-lib'

import { chooseRule, getRuleWithLocation, RuleWithLocation } from '../../../lib/commands/rules/rules-util'
import RulesUpdateCommand from '../../../commands/rules/update'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		inputAndOutputItem: jest.fn(),
		selectFromList: jest.fn(),
	}
})

jest.mock('../../../lib/commands/rules/rules-util', () => {
	return {
		tableFieldDefinitions: ['field1'],
		chooseRule: jest.fn(),
		getRuleWithLocation: jest.fn(),
	}
})

describe('RulesUpdateCommand', () => {
	const inputAndOutputItemMock = inputAndOutputItem as unknown as
		jest.Mock<Promise<void>, [SmartThingsCommandInterface, CommonOutputProducer<Rule>,
			ActionFunction<void, RuleRequest, Rule>]>

	const ruleWithLocation = { locationId: 'location-id' } as RuleWithLocation
	const chooseRuleMock = chooseRule as unknown as
		jest.Mock<Promise<string>, [APICommand, string, string | undefined, string | undefined]>
	const getRuleWithLocationMock = (getRuleWithLocation as
			jest.Mock<Promise<RuleWithLocation>, [SmartThingsClient, string, string | undefined]>)
		.mockResolvedValue(ruleWithLocation)

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('allows user to select rule', async () => {
		chooseRuleMock.mockResolvedValueOnce('chosen-rule-id')

		await expect(RulesUpdateCommand.run([])).resolves.not.toThrow()

		expect(chooseRuleMock).toHaveBeenCalledTimes(1)
		expect(chooseRuleMock).toHaveBeenCalledWith(expect.any(RulesUpdateCommand),
			'Select a rule to update.', undefined, undefined)
		expect(inputAndOutputItemMock).toHaveBeenCalledTimes(1)
		expect(inputAndOutputItemMock).toHaveBeenCalledWith(expect.any(RulesUpdateCommand),
			expect.objectContaining({ tableFieldDefinitions: expect.arrayContaining(['field1']) }),
			expect.any(Function))

		const ruleRequest = { name: 'rule-to-update' } as RuleRequest
		const updatedRule = { id: 'update-rule-id' } as Rule
		const updateSpy = jest.spyOn(RulesEndpoint.prototype, 'update').mockResolvedValue(updatedRule)
		getRuleWithLocationMock.mockResolvedValue(ruleWithLocation)

		const actionFunction = inputAndOutputItemMock.mock.calls[0][2]
		expect(await actionFunction(undefined, ruleRequest)).toBe(updatedRule)

		expect(getRuleWithLocationMock).toHaveBeenCalledTimes(1)
		expect(getRuleWithLocationMock).toHaveBeenCalledWith(expect.any(SmartThingsClient),
			'chosen-rule-id', undefined)
		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(updateSpy).toHaveBeenCalledWith('chosen-rule-id', ruleRequest, 'location-id')
	})

	it('uses rule id from command line', async () => {
		chooseRuleMock.mockResolvedValueOnce('chosen-rule-id')

		await expect(RulesUpdateCommand.run(['cmd-line-rule-id'])).resolves.not.toThrow()

		expect(chooseRuleMock).toHaveBeenCalledTimes(1)
		expect(chooseRuleMock).toHaveBeenCalledWith(expect.any(RulesUpdateCommand),
			'Select a rule to update.', undefined, 'cmd-line-rule-id')
		expect(inputAndOutputItemMock).toHaveBeenCalledTimes(1)
		expect(inputAndOutputItemMock).toHaveBeenCalledWith(expect.any(RulesUpdateCommand),
			expect.objectContaining({ tableFieldDefinitions: expect.arrayContaining(['field1']) }),
			expect.any(Function))
	})

	it('uses location id from command line', async () => {
		chooseRuleMock.mockResolvedValueOnce('chosen-rule-id')

		await expect(RulesUpdateCommand.run(['--location-id', 'cmd-line-location-id'])).resolves.not.toThrow()

		expect(chooseRuleMock).toHaveBeenCalledTimes(1)
		expect(chooseRuleMock).toHaveBeenCalledWith(expect.any(RulesUpdateCommand),
			'Select a rule to update.', 'cmd-line-location-id', undefined)
		expect(inputAndOutputItemMock).toHaveBeenCalledTimes(1)
		expect(inputAndOutputItemMock).toHaveBeenCalledWith(expect.any(RulesUpdateCommand),
			expect.objectContaining({ tableFieldDefinitions: expect.arrayContaining(['field1']) }),
			expect.any(Function))
	})
})
