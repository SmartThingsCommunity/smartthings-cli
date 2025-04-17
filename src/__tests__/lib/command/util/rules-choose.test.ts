import { jest } from '@jest/globals'

import type { Rule } from '@smartthings/core-sdk'

import type { WithLocation } from '../../../../lib/api-helpers.js'
import type { APICommand } from '../../../../lib/command/api-command.js'
import type { getRulesByLocation } from '../../../../lib/command/util/rules-util.js'
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
	const command = { client: { rules: {} } } as APICommand

	expect(await listItems(command)).toBe(ruleList)

	expect(getRulesByLocationMock).toHaveBeenCalledExactlyOnceWith(command.client, 'location-id')
})
