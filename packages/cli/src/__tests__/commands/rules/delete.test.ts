import { RulesEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { APICommand } from '@smartthings/cli-lib'

import RulesDeleteCommand from '../../../commands/rules/delete'
import { chooseRule, getRuleWithLocation, RuleWithLocation } from '../../../lib/commands/rules/rules-util'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		selectFromList: jest.fn(),
	}
})

jest.mock('../../../lib/commands/rules/rules-util')

describe('RulesDeleteCommand', () => {
	const ruleWithLocation = { locationId: 'location-id' } as RuleWithLocation
	const chooseRuleMock = chooseRule as unknown as
		jest.Mock<Promise<string>, [APICommand, string, string | undefined, string | undefined]>
	const getRuleWithLocationMock = (getRuleWithLocation as
			jest.Mock<Promise<RuleWithLocation>, [SmartThingsClient, string, string | undefined]>)
		.mockResolvedValue(ruleWithLocation)

	const deleteSpy = jest.spyOn(RulesEndpoint.prototype, 'delete').mockImplementation()

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('allows user to select rule', async () => {
		chooseRuleMock.mockResolvedValueOnce('chosen-rule-id')
		getRuleWithLocationMock.mockResolvedValue(ruleWithLocation)

		await expect(RulesDeleteCommand.run()).resolves.not.toThrow()

		expect(chooseRuleMock).toHaveBeenCalledTimes(1)
		expect(chooseRuleMock).toHaveBeenCalledWith(expect.any(RulesDeleteCommand),
			'Select a rule to delete.', undefined, undefined)
		expect(getRuleWithLocationMock).toHaveBeenCalledTimes(1)
		expect(getRuleWithLocationMock).toHaveBeenCalledWith(expect.any(SmartThingsClient),
			'chosen-rule-id', undefined)
		expect(deleteSpy).toHaveBeenCalledTimes(1)
		expect(deleteSpy).toHaveBeenCalledWith('chosen-rule-id', 'location-id')
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
	})

	it('uses location from command line', async () => {
		chooseRuleMock.mockResolvedValueOnce('chosen-rule-id')
		getRuleWithLocationMock.mockResolvedValue(ruleWithLocation)

		await expect(RulesDeleteCommand.run(['--location-id', 'cmd-line-location-id'])).resolves.not.toThrow()

		expect(chooseRuleMock).toHaveBeenCalledTimes(1)
		expect(chooseRuleMock).toHaveBeenCalledWith(expect.any(RulesDeleteCommand),
			'Select a rule to delete.', 'cmd-line-location-id', undefined)
		expect(getRuleWithLocationMock).toHaveBeenCalledTimes(0)
		expect(deleteSpy).toHaveBeenCalledTimes(1)
		expect(deleteSpy).toHaveBeenCalledWith('chosen-rule-id', 'cmd-line-location-id')
	})
})
