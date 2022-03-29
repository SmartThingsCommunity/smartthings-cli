import { Rule, RuleRequest, RulesEndpoint } from '@smartthings/core-sdk'

import { inputAndOutputItem } from '@smartthings/cli-lib'

import RulesCreateCommand from '../../../commands/rules/create'
import { chooseLocation } from '../../../commands/locations'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		inputAndOutputItem: jest.fn(),
	}
})

jest.mock('../../../commands/locations')

describe('RulesCreateCommand', () => {
	const inputAndOutputItemMock = jest.mocked(inputAndOutputItem)
	const chooseLocationMock = jest.mocked(chooseLocation)

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('allows user to choose location', async () => {
		chooseLocationMock.mockResolvedValue('chosen-location-id')

		await expect(RulesCreateCommand.run([])).resolves.not.toThrow()

		expect(chooseLocationMock).toHaveBeenCalledTimes(1)
		expect(chooseLocationMock).toHaveBeenCalledWith(expect.any(RulesCreateCommand), undefined)
		expect(inputAndOutputItemMock).toHaveBeenCalledTimes(1)
		expect(inputAndOutputItemMock).toHaveBeenCalledWith(expect.any(RulesCreateCommand),
			expect.objectContaining({ tableFieldDefinitions: expect.arrayContaining(['name', 'id']) }),
			expect.any(Function))

		const ruleRequest = { name: 'rule-to-create' } as RuleRequest
		const ruleCreated = { id: 'created-rule-id' } as Rule
		const createSpy = jest.spyOn(RulesEndpoint.prototype, 'create').mockResolvedValue(ruleCreated)

		const actionFunction = inputAndOutputItemMock.mock.calls[0][2]
		expect(await actionFunction(undefined, ruleRequest)).toBe(ruleCreated)

		expect(createSpy).toHaveBeenCalledTimes(1)
		expect(createSpy).toHaveBeenCalledWith(ruleRequest, 'chosen-location-id')
	})

	it('uses location specified on command line', async () => {
		chooseLocationMock.mockResolvedValue('chosen-location-id')

		await expect(RulesCreateCommand.run(['--location-id', 'cmd-line-location-id'])).resolves.not.toThrow()

		expect(chooseLocationMock).toHaveBeenCalledTimes(1)
		expect(chooseLocationMock).toHaveBeenCalledWith(expect.any(RulesCreateCommand), 'cmd-line-location-id')
		expect(inputAndOutputItemMock).toHaveBeenCalledTimes(1)
		expect(inputAndOutputItemMock).toHaveBeenCalledWith(expect.any(RulesCreateCommand),
			expect.objectContaining({ tableFieldDefinitions: expect.arrayContaining(['name', 'id']) }),
			expect.any(Function))
	})
})
