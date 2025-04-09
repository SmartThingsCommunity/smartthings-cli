import { jest } from '@jest/globals'

import type { EdgeCommand } from '../../../../lib/command/edge-command.js'
import type { buildListFunction } from '../../../../lib/command/util/edge-invites-util.js'
import { ChooseFunction, createChooseFn } from '../../../../lib/command/util/util-util.js'
import type { Invitation } from '../../../../lib/edge/endpoints/invites.js'


const buildListFunctionMock = jest.fn<typeof buildListFunction>()
jest.unstable_mockModule('../../../../lib/command/util/edge-invites-util.js', () => ({
	buildListFunction: buildListFunctionMock,
}))

const createChooseFnMock = jest.fn<typeof createChooseFn<Invitation>>()
jest.unstable_mockModule('../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))


const { chooseInviteFn } = await import('../../../../lib/command/util/edge-invites-choose.js')


describe('chooseInviteFn', () => {
	const command = {} as EdgeCommand

	const chooseInvite = jest.fn<ChooseFunction<Invitation>>()
	createChooseFnMock.mockReturnValue(chooseInvite)

	const listFunctionMock = jest.fn<ReturnType<typeof buildListFunction>>()
	buildListFunctionMock.mockReturnValue(listFunctionMock)

	it('allows all without channel id', async () => {
		expect(chooseInviteFn(command)).toBe(chooseInvite)

		expect(buildListFunctionMock).toHaveBeenCalledExactlyOnceWith(command, undefined)
		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ itemName: 'invitation' }),
			listFunctionMock,
		)
	})

	it('limits by channel when specified', async () => {
		expect(chooseInviteFn(command, { channelId: 'specified-channel-id' })).toBe(chooseInvite)

		expect(buildListFunctionMock).toHaveBeenCalledExactlyOnceWith(command, 'specified-channel-id')
		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ itemName: 'invitation' }),
			listFunctionMock,
		)
	})
})
