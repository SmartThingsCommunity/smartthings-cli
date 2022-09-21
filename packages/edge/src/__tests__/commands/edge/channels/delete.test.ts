import { resetManagedConfigKey } from '@smartthings/cli-lib'
import { ChannelsEndpoint } from '@smartthings/core-sdk'

import ChannelsDeleteCommand from '../../../../commands/edge/channels/delete'
import { chooseChannel } from '../../../../lib/commands/channels-util'


jest.mock('../../../../../src/lib/commands/channels-util')

describe('ChannelsDeleteCommand', () => {
	const chooseDriverMock = jest.mocked(chooseChannel).mockResolvedValue('chosen-channel-id')
	const apiChannelsDeleteSpy = jest.spyOn(ChannelsEndpoint.prototype, 'delete').mockImplementation()
	const resetManagedConfigKeyMock = jest.mocked(resetManagedConfigKey)

	it('deletes a channel', async () => {
		await expect(ChannelsDeleteCommand.run(['cmd-line-channel-id'])).resolves.not.toThrow()

		expect(chooseDriverMock).toHaveBeenCalledTimes(1)
		expect(chooseDriverMock).toHaveBeenCalledWith(expect.any(ChannelsDeleteCommand),
			'Choose a channel to delete.', 'cmd-line-channel-id')

		expect(apiChannelsDeleteSpy).toHaveBeenCalledTimes(1)
		expect(apiChannelsDeleteSpy).toHaveBeenCalledWith('chosen-channel-id')
		expect(resetManagedConfigKeyMock).toHaveBeenCalledTimes(1)
		expect(resetManagedConfigKeyMock).toHaveBeenCalledWith(
			expect.objectContaining({ profileName: 'default' }),
			'defaultChannel',
			expect.any(Function),
		)

		const predicate = resetManagedConfigKeyMock.mock.calls[0][2]
		expect(predicate('another-channel-id')).toBeFalsy()
		expect(predicate('chosen-channel-id')).toBeTruthy()
	})
})
