import { outputListing } from '@smartthings/cli-lib'
import { SmartThingsClient } from '@smartthings/core-sdk'

import RulesCommand from '../../commands/rules'
import { getRulesByLocation, getRuleWithLocation, RuleWithLocation } from '../../lib/commands/rules/rules-util'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputListing: jest.fn(),
	}
})

jest.mock('../../lib/commands/rules/rules-util')

describe('RulesCommand', () => {
	const outputListingMock = jest.mocked(outputListing)
	const ruleWithLocation = { id: 'rule-id' } as RuleWithLocation
	const rulesList = [ruleWithLocation]
	const getRulesByLocationMock = jest.mocked(getRulesByLocation).mockResolvedValue(rulesList)
	const getRuleWithLocationMock = jest.mocked(getRuleWithLocation).mockResolvedValue(ruleWithLocation)

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('calls outputListing to list rules', async () => {
		await expect(RulesCommand.run([])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(outputListingMock).toHaveBeenCalledWith(expect.any(RulesCommand),
			expect.objectContaining({
				primaryKeyName: 'id',
				listTableFieldDefinitions: expect.arrayContaining(['name', 'id', 'locationId', 'locationName']),
			}),
			undefined, expect.any(Function), expect.any(Function))

		const listFunction = outputListingMock.mock.calls[0][3]
		expect(await listFunction()).toBe(rulesList)
		expect(getRulesByLocationMock).toHaveBeenCalledTimes(1)
		expect(getRulesByLocationMock).toHaveBeenCalledWith(expect.any(SmartThingsClient), undefined)
	})

	it('calls outputListing to get a rule', async () => {
		await expect(RulesCommand.run(['cmd-line-rule-id'])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(outputListingMock).toHaveBeenCalledWith(expect.any(RulesCommand),
			expect.objectContaining({
				primaryKeyName: 'id',
				listTableFieldDefinitions: expect.arrayContaining(['name', 'id', 'locationId', 'locationName']),
			}),
			'cmd-line-rule-id', expect.any(Function), expect.any(Function))

		const getFunction = outputListingMock.mock.calls[0][4]
		expect(await getFunction('rule-id')).toBe(ruleWithLocation)
		expect(getRuleWithLocationMock).toHaveBeenCalledTimes(1)
		expect(getRuleWithLocationMock).toHaveBeenCalledWith(expect.any(SmartThingsClient),
			'rule-id', undefined)
	})

	it('passes location id from command line', async () => {
		await expect(RulesCommand.run(['--location-id', 'cmd-line-location-id'])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(outputListingMock).toHaveBeenCalledWith(expect.any(RulesCommand),
			expect.objectContaining({
				primaryKeyName: 'id',
				listTableFieldDefinitions: expect.arrayContaining(['name', 'id', 'locationId', 'locationName']),
			}),
			undefined, expect.any(Function), expect.any(Function))

		const listFunction = outputListingMock.mock.calls[0][3]
		expect(await listFunction()).toBe(rulesList)
		expect(getRulesByLocationMock).toHaveBeenCalledTimes(1)
		expect(getRulesByLocationMock).toHaveBeenCalledWith(expect.any(SmartThingsClient),
			'cmd-line-location-id')

		const getFunction = outputListingMock.mock.calls[0][4]
		expect(await getFunction('rule-id')).toBe(ruleWithLocation)
		expect(getRuleWithLocationMock).toHaveBeenCalledTimes(1)
		expect(getRuleWithLocationMock).toHaveBeenCalledWith(expect.any(SmartThingsClient),
			'rule-id', 'cmd-line-location-id')
	})
})
