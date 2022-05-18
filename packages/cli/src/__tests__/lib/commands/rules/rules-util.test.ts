import { Rule, RuleAction, RuleExecutionResponse, SmartThingsClient } from '@smartthings/core-sdk'

import { APICommand, selectFromList, TableGenerator } from '@smartthings/cli-lib'

import {
	chooseRule, getRulesByLocation, getRuleWithLocation, RuleWithLocation,
	tableFieldDefinitions,
} from '../../../../lib/commands/rules/rules-util'
import * as rulesUtil from '../../../../lib/commands/rules/rules-util'


describe('rules-util', () => {
	const location1 = { locationId: 'location-id-1', name: 'location-name-1' }
	const location2 = { locationId: 'location-id-2', name: 'location-name-2' }
	const rule1 = { id: 'rule-id-1', name: 'rule-name-1' }
	const rule2 = { id: 'rule-id-2', name: 'rule-name-2' }
	const rule1WithLocation = { ...rule1, locationId: 'location-id-1', locationName: 'location-name-1' } as RuleWithLocation
	const rule2WithLocation = { ...rule2, locationId: 'location-id-2', locationName: 'location-name-2' } as RuleWithLocation

	const locations = {
		get: jest.fn(),
		list: jest.fn(),
	}
	const rules = {
		get: jest.fn(),
		list: jest.fn(),
	}

	const client = { locations, rules } as unknown as SmartThingsClient

	describe('tableFieldDefinitions', () => {
		it('counts rule actions', () => {
			const numActionsDefinition = tableFieldDefinitions[2] as { value: (rule: Rule) => string }
			const rule = { actions: [1, 2, 3] as unknown as RuleAction[] } as Rule
			expect(numActionsDefinition.value(rule)).toBe('3')
		})
	})

	describe('getRulesByLocation', () => {
		it('looks up location when one is specified', async () => {
			locations.get.mockResolvedValueOnce(location1)
			rules.list.mockResolvedValueOnce([rule1])

			expect(await getRulesByLocation(client, 'location-id-1')).toEqual([rule1WithLocation])

			expect(locations.get).toHaveBeenCalledTimes(1)
			expect(locations.get).toHaveBeenCalledWith('location-id-1')
			expect(rules.list).toHaveBeenCalledTimes(1)
			expect(rules.list).toHaveBeenCalledWith('location-id-1')

			expect(locations.list).toHaveBeenCalledTimes(0)
			expect(rules.get).toHaveBeenCalledTimes(0)
		})

		it('combines rules from all locations when none is specified', async () => {
			locations.list.mockResolvedValueOnce([location1, location2])
			rules.list.mockResolvedValueOnce([rule1])
			rules.list.mockResolvedValueOnce([rule2])

			expect(await getRulesByLocation(client)).toEqual([rule1WithLocation, rule2WithLocation])

			expect(locations.list).toHaveBeenCalledTimes(1)
			expect(rules.list).toHaveBeenCalledTimes(2)
			expect(rules.list).toHaveBeenCalledWith('location-id-1')
			expect(rules.list).toHaveBeenCalledWith('location-id-2')

			expect(locations.get).toHaveBeenCalledTimes(0)
			expect(rules.get).toHaveBeenCalledTimes(0)
		})

		it('throws an error when no location is found', async () => {
			locations.list.mockResolvedValueOnce([])

			await expect(getRulesByLocation(client)).rejects.toThrow(
				'Could not find any locations for your account. Perhaps ' +
				"you haven't created any locations yet.")

			expect(locations.list).toHaveBeenCalledTimes(1)

			expect(locations.get).toHaveBeenCalledTimes(0)
			expect(rules.get).toHaveBeenCalledTimes(0)
			expect(rules.list).toHaveBeenCalledTimes(0)
		})
	})

	describe('getRuleWithLocation', () => {
		const getRulesByLocationSpy = jest.spyOn(rulesUtil, 'getRulesByLocation')

		it('uses simple location lookup when locationId specified', async () => {
			locations.get.mockResolvedValueOnce(location1)
			rules.get.mockResolvedValueOnce(rule1)

			expect(await getRuleWithLocation(client, 'rule-id-1', 'location-id-1'))
				.toEqual(rule1WithLocation)

			expect(locations.get).toHaveBeenCalledTimes(1)
			expect(locations.get).toHaveBeenCalledWith('location-id-1')
			expect(rules.get).toHaveBeenCalledTimes(1)
			expect(rules.get).toHaveBeenCalledWith('rule-id-1', 'location-id-1')

			expect(locations.list).toHaveBeenCalledTimes(0)
			expect(rules.list).toHaveBeenCalledTimes(0)
			expect(getRulesByLocationSpy).toHaveBeenCalledTimes(0)
		})

		it('searches for rule by location when no location id specified', async () => {
			getRulesByLocationSpy.mockResolvedValueOnce([rule1WithLocation, rule2WithLocation])

			expect(await getRuleWithLocation(client, 'rule-id-1')).toBe(rule1WithLocation)

			expect(getRulesByLocationSpy).toHaveBeenCalledTimes(1)
			expect(getRulesByLocationSpy).toHaveBeenCalledWith(client, undefined)

			expect(locations.get).toHaveBeenCalledTimes(0)
			expect(locations.list).toHaveBeenCalledTimes(0)
			expect(rules.get).toHaveBeenCalledTimes(0)
			expect(rules.list).toHaveBeenCalledTimes(0)
		})

		it('throws error when no rule found when searching', async () => {
			getRulesByLocationSpy.mockResolvedValueOnce([rule1WithLocation, rule2WithLocation])

			await expect(getRuleWithLocation(client, 'rule-id-3')).rejects
				.toThrow('could not find rule with id rule-id-3 in any location')

			expect(getRulesByLocationSpy).toHaveBeenCalledTimes(1)
			expect(getRulesByLocationSpy).toHaveBeenCalledWith(client, undefined)

			expect(locations.get).toHaveBeenCalledTimes(0)
			expect(locations.list).toHaveBeenCalledTimes(0)
			expect(rules.get).toHaveBeenCalledTimes(0)
			expect(rules.list).toHaveBeenCalledTimes(0)
		})
	})

	test('chooseRule proxies correctly to selectFromList', async () => {
		const selectFromListMock = jest.mocked(selectFromList).mockResolvedValue('chosen-rule-id')
		const client = {} as SmartThingsClient
		const command = { client } as APICommand<typeof APICommand.flags>

		expect(await chooseRule(command, 'prompt message', 'location-id', 'cmd-line-rule-id'))
			.toBe('chosen-rule-id')

		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ primaryKeyName: 'id' }),
			expect.objectContaining({
				preselectedId: 'cmd-line-rule-id',
				promptMessage: 'prompt message',
			}),
		)

		const ruleWithLocation = { locationId: 'location-id' } as RuleWithLocation
		const rulesList = [ruleWithLocation]
		const listItems = selectFromListMock.mock.calls[0][2].listItems
		const getRulesByLocationMock = (getRulesByLocation as
			jest.Mock<Promise<RuleWithLocation[]>, [SmartThingsClient, string | undefined]>)
			.mockResolvedValue(rulesList)

		expect(await listItems()).toBe(rulesList)

		expect(getRulesByLocationMock).toHaveBeenCalledTimes(1)
		expect(getRulesByLocationMock).toHaveBeenCalledWith(client, 'location-id')
	})

	describe('buildExecuteResponseTableOutput', () => {
		const buildTableFromItemMock = jest.fn().mockReturnValue('main info')
		const buildTableFromListMock = jest.fn().mockReturnValue('actions info')
		const tableGenerator = {
			buildTableFromItem: buildTableFromItemMock,
			buildTableFromList: buildTableFromListMock,
		} as unknown as TableGenerator

		it('includes actions when present', () => {
			const executeResponse = {
				id: 'execute-response-id',
				actions: [{ actionId: 'action-id' }],
			} as RuleExecutionResponse

			expect(rulesUtil.buildExecuteResponseTableOutput(tableGenerator, executeResponse))
				.toBe('main info\n\nActions\nactions info\nsummarized text')

			expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
			expect(buildTableFromItemMock).toHaveBeenCalledWith(executeResponse,
				['executionId', 'id', 'result'])
			expect(buildTableFromListMock).toHaveBeenCalledTimes(1)
			expect(buildTableFromListMock).toHaveBeenCalledWith(executeResponse.actions,
				expect.arrayContaining(['actionId', 'location.locationId']))
		})

		it('leaves out actions table when there are no actions', () => {
			const executeResponse = { id: 'execute-response-id' } as RuleExecutionResponse

			expect(rulesUtil.buildExecuteResponseTableOutput(tableGenerator, executeResponse))
				.toBe('main info\nsummarized text')

			expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
			expect(buildTableFromItemMock).toHaveBeenCalledWith(executeResponse,
				['executionId', 'id', 'result'])
			expect(buildTableFromListMock).toHaveBeenCalledTimes(0)
		})
	})
})
