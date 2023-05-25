import { Rule, RulesEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { WithNamedLocation } from '@smartthings/cli-lib'

import RulesDeleteCommand from '../../../commands/rules/delete.js'
import { chooseRule, getRuleWithLocation } from '../../../lib/commands/rules-util.js'


jest.mock('../../../lib/commands/rules-util')

describe('RulesDeleteCommand', () => {
	const ruleWithLocation = { locationId: 'location-id' } as Rule & WithNamedLocation
	const chooseRuleMock = jest.mocked(chooseRule)
	const getRuleWithLocationMock = jest.mocked(getRuleWithLocation).mockResolvedValue(ruleWithLocation)

	const deleteSpy = jest.spyOn(RulesEndpoint.prototype, 'delete').mockImplementation()
	const logSpy = jest.spyOn(RulesDeleteCommand.prototype, 'log').mockImplementation()

	it('allows user to select rule', async () => {
		chooseRuleMock.mockResolvedValueOnce('chosen-rule-id')
		getRuleWithLocationMock.mockResolvedValue(ruleWithLocation)

		await expect(RulesDeleteCommand.run([])).resolves.not.toThrow()

		expect(chooseRuleMock).toHaveBeenCalledTimes(1)
		expect(chooseRuleMock).toHaveBeenCalledWith(expect.any(RulesDeleteCommand),
			'Select a rule to delete.', undefined, undefined)
		expect(getRuleWithLocationMock).toHaveBeenCalledTimes(1)
		expect(getRuleWithLocationMock).toHaveBeenCalledWith(expect.any(SmartThingsClient),
			'chosen-rule-id', undefined)
		expect(deleteSpy).toHaveBeenCalledTimes(1)
		expect(deleteSpy).toHaveBeenCalledWith('chosen-rule-id', 'location-id')
		expect(logSpy).toHaveBeenCalledWith('Rule chosen-rule-id deleted.')
	})

	it('use rule id from command line', async () => {
		chooseRuleMock.mockResolvedValueOnce('chosen-rule-id')
		getRuleWithLocationMock.mockResolvedValue(ruleWithLocation)

		await expect(RulesDeleteCommand.run(['cmd-line-rule-id'])).resolves.not.toThrow()

		expect(chooseRuleMock).toHaveBeenCalledTimes(1)
		expect(chooseRuleMock).toHaveBeenCalledWith(expect.any(RulesDeleteCommand),
			'Select a rule to delete.', undefined, 'cmd-line-rule-id')
		expect(getRuleWithLocationMock).toHaveBeenCalledTimes(1)
		expect(getRuleWithLocationMock).toHaveBeenCalledWith(expect.any(SmartThingsClient),
			'chosen-rule-id', undefined)
		expect(deleteSpy).toHaveBeenCalledTimes(1)
		expect(deleteSpy).toHaveBeenCalledWith('chosen-rule-id', 'location-id')
		expect(logSpy).toHaveBeenCalledWith('Rule chosen-rule-id deleted.')
	})

	it('uses location from command line', async () => {
		chooseRuleMock.mockResolvedValueOnce('chosen-rule-id')
		getRuleWithLocationMock.mockResolvedValue(ruleWithLocation)

		await expect(RulesDeleteCommand.run(['--location', 'cmd-line-location-id'])).resolves.not.toThrow()

		expect(chooseRuleMock).toHaveBeenCalledTimes(1)
		expect(chooseRuleMock).toHaveBeenCalledWith(expect.any(RulesDeleteCommand),
			'Select a rule to delete.', 'cmd-line-location-id', undefined)
		expect(getRuleWithLocationMock).toHaveBeenCalledTimes(0)
		expect(deleteSpy).toHaveBeenCalledTimes(1)
		expect(deleteSpy).toHaveBeenCalledWith('chosen-rule-id', 'cmd-line-location-id')
		expect(logSpy).toHaveBeenCalledWith('Rule chosen-rule-id deleted.')
	})
})
