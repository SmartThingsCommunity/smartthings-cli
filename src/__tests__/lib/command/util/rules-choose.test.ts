import { jest } from '@jest/globals'

import { Rule, SmartThingsClient } from '@smartthings/core-sdk'

import type { WithLocation } from '../../../../lib/api-helpers.js'
import { getRulesByLocation } from '../../../../lib/command/util/rules-util.js'
import type { createChooseFn, ChooseFunction } from '../../../../lib/command/util/util-util.js'


const getRulesByLocationMock = jest.fn<typeof getRulesByLocation>()
jest.unstable_mockModule('../../../../lib/command/util/rules-util.js', () => ({
	getRulesByLocation: getRulesByLocationMock,
}))

const createChooseFnMock = jest.fn<typeof createChooseFn<Rule & WithLocation>>()
jest.unstable_mockModule('../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))


const {
	chooseRuleFn,
} = await import('../../../../lib/command/util/rules-choose.js')


test('chooseRuleFn', async () => {
	const chooseRuleMock = jest.fn<ChooseFunction<Rule & WithLocation>>()
	createChooseFnMock.mockReturnValueOnce(chooseRuleMock)

	const chooseApp = chooseRuleFn('location-id')

	expect(chooseApp).toBe(chooseRuleMock)

	expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({ itemName: 'rule' }),
		expect.any(Function),
	)

	const ruleList = [{ id: 'listed-rule-id' } as Rule & WithLocation]
	getRulesByLocationMock.mockResolvedValueOnce(ruleList)
	const listItems = createChooseFnMock.mock.calls[0][1]
	const client = { rules: {} } as SmartThingsClient

	expect(await listItems(client)).toBe(ruleList)

	expect(getRulesByLocationMock).toHaveBeenCalledExactlyOnceWith(client, 'location-id')
})
