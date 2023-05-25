import { outputItemOrList, WithNamedLocation } from '@smartthings/cli-lib'
import { Rule, SmartThingsClient } from '@smartthings/core-sdk'

import RulesCommand from '../../commands/rules.js'
import { getRulesByLocation, getRuleWithLocation } from '../../lib/commands/rules-util.js'


jest.mock('../../lib/commands/rules-util')

describe('RulesCommand', () => {
	const outputItemOrListMock = jest.mocked(outputItemOrList)
	const ruleWithLocation = { id: 'rule-id' } as Rule & WithNamedLocation
	const rulesList = [ruleWithLocation]
	const getRulesByLocationMock = jest.mocked(getRulesByLocation).mockResolvedValue(rulesList)
	const getRuleWithLocationMock = jest.mocked(getRuleWithLocation).mockResolvedValue(ruleWithLocation)

	it('calls outputItemOrList to list rules', async () => {
		await expect(RulesCommand.run([])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(expect.any(RulesCommand),
			expect.objectContaining({
				primaryKeyName: 'id',
				listTableFieldDefinitions: expect.arrayContaining(['name', 'id', 'locationId', 'location']),
			}),
			undefined, expect.any(Function), expect.any(Function))

		const listFunction = outputItemOrListMock.mock.calls[0][3]
		expect(await listFunction()).toBe(rulesList)
		expect(getRulesByLocationMock).toHaveBeenCalledTimes(1)
		expect(getRulesByLocationMock).toHaveBeenCalledWith(expect.any(SmartThingsClient), undefined)
	})

	it('calls outputItemOrList to get a rule', async () => {
		await expect(RulesCommand.run(['cmd-line-rule-id'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(expect.any(RulesCommand),
			expect.objectContaining({
				primaryKeyName: 'id',
				listTableFieldDefinitions: expect.arrayContaining(['name', 'id', 'locationId', 'location']),
			}),
			'cmd-line-rule-id', expect.any(Function), expect.any(Function))

		const getFunction = outputItemOrListMock.mock.calls[0][4]
		expect(await getFunction('rule-id')).toBe(ruleWithLocation)
		expect(getRuleWithLocationMock).toHaveBeenCalledTimes(1)
		expect(getRuleWithLocationMock).toHaveBeenCalledWith(expect.any(SmartThingsClient),
			'rule-id', undefined)
	})

	it('passes location id from command line', async () => {
		await expect(RulesCommand.run(['--location', 'cmd-line-location-id'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(expect.any(RulesCommand),
			expect.objectContaining({
				primaryKeyName: 'id',
				listTableFieldDefinitions: expect.arrayContaining(['name', 'id', 'locationId', 'location']),
			}),
			undefined, expect.any(Function), expect.any(Function))

		const listFunction = outputItemOrListMock.mock.calls[0][3]
		expect(await listFunction()).toBe(rulesList)
		expect(getRulesByLocationMock).toHaveBeenCalledTimes(1)
		expect(getRulesByLocationMock).toHaveBeenCalledWith(expect.any(SmartThingsClient),
			'cmd-line-location-id')

		const getFunction = outputItemOrListMock.mock.calls[0][4]
		expect(await getFunction('rule-id')).toBe(ruleWithLocation)
		expect(getRuleWithLocationMock).toHaveBeenCalledTimes(1)
		expect(getRuleWithLocationMock).toHaveBeenCalledWith(expect.any(SmartThingsClient),
			'rule-id', 'cmd-line-location-id')
	})
})
