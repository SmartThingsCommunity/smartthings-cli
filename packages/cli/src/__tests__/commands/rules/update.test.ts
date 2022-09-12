import { Rule, RuleRequest, RulesEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { inputAndOutputItem, WithNamedLocation } from '@smartthings/cli-lib'

import { chooseRule, getRuleWithLocation } from '../../../lib/commands/rules-util'
import RulesUpdateCommand from '../../../commands/rules/update'


jest.mock('../../../lib/commands/rules-util', () => {
	return {
		tableFieldDefinitions: ['field1'],
		chooseRule: jest.fn(),
		getRuleWithLocation: jest.fn(),
	}
})

describe('RulesUpdateCommand', () => {
	const inputAndOutputItemMock = jest.mocked(inputAndOutputItem)
	const ruleWithLocation = { locationId: 'location-id' } as Rule & WithNamedLocation
	const chooseRuleMock = jest.mocked(chooseRule)
	const getRuleWithLocationMock = jest.mocked(getRuleWithLocation).mockResolvedValue(ruleWithLocation)

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

		await expect(RulesUpdateCommand.run(['--location', 'cmd-line-location-id'])).resolves.not.toThrow()

		expect(chooseRuleMock).toHaveBeenCalledTimes(1)
		expect(chooseRuleMock).toHaveBeenCalledWith(expect.any(RulesUpdateCommand),
			'Select a rule to update.', 'cmd-line-location-id', undefined)
		expect(inputAndOutputItemMock).toHaveBeenCalledTimes(1)
		expect(inputAndOutputItemMock).toHaveBeenCalledWith(expect.any(RulesUpdateCommand),
			expect.objectContaining({ tableFieldDefinitions: expect.arrayContaining(['field1']) }),
			expect.any(Function))
	})
})
