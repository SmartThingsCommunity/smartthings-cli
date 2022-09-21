import { EnrolledChannel, HubdevicesEndpoint } from '@smartthings/core-sdk'

import { selectFromList } from '@smartthings/cli-lib'

import { chooseDriverFromChannel, chooseHub } from '../../../../lib/commands/drivers-util'
import DriversInstallCommand from '../../../../commands/edge/drivers/install'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		selectFromList: jest.fn(),
	}
})
jest.mock('../../../../../src/lib/commands/drivers-util')

describe('DriversInstallCommand', () => {
	const chooseHubMock = jest.mocked(chooseHub)
	const chooseDriverFromChannelMock = jest.mocked(chooseDriverFromChannel)
	const selectFromListMock = jest.mocked(selectFromList)
	const enrolledChannelsSpy = jest.spyOn(HubdevicesEndpoint.prototype, 'enrolledChannels')
	const installDriverSpy = jest.spyOn(HubdevicesEndpoint.prototype, 'installDriver')
	const logSpy = jest.spyOn(DriversInstallCommand.prototype, 'log').mockImplementation()

	chooseHubMock.mockResolvedValue('chosen-hub-id')
	selectFromListMock.mockResolvedValue('chosen-channel-id')
	chooseDriverFromChannelMock.mockResolvedValue('chosen-driver-id')
	installDriverSpy.mockImplementation(async () => {
		// empty
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('installs driver and logs message', async () => {
		await expect(DriversInstallCommand.run([])).resolves.not.toThrow()

		expect(chooseHubMock).toHaveBeenCalledTimes(1)
		expect(chooseHubMock).toHaveBeenCalledWith(expect.any(DriversInstallCommand),
			'Select a hub to install to.', undefined, { useConfigDefault: true })
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(expect.any(DriversInstallCommand),
			expect.objectContaining({ primaryKeyName: 'channelId' }),
			expect.objectContaining({ promptMessage: 'Select a channel to install the driver from.' }))
		expect(chooseDriverFromChannelMock).toHaveBeenCalledTimes(1)
		expect(chooseDriverFromChannelMock).toHaveBeenCalledWith(expect.any(DriversInstallCommand),
			'chosen-channel-id', undefined)
		expect(installDriverSpy).toHaveBeenCalledTimes(1)
		expect(installDriverSpy).toHaveBeenCalledWith('chosen-driver-id', 'chosen-hub-id',
			'chosen-channel-id')
		expect(logSpy).toHaveBeenCalledWith('driver chosen-driver-id installed to hub chosen-hub-id')

		const channelsList = [{ name: 'channel' }] as EnrolledChannel[]
		enrolledChannelsSpy.mockResolvedValue(channelsList)

		const listItems = selectFromListMock.mock.calls[0][2].listItems

		expect(await listItems()).toBe(channelsList)

		expect(enrolledChannelsSpy).toHaveBeenCalledTimes(1)
		expect(enrolledChannelsSpy).toHaveBeenCalledWith('chosen-hub-id')
	})

	it('uses hub from command line if specified', async () => {
		await expect(DriversInstallCommand.run(['--hub', 'command-line-hub-id'])).resolves.not.toThrow()

		expect(chooseHubMock).toHaveBeenCalledTimes(1)
		expect(chooseHubMock).toHaveBeenCalledWith(expect.any(DriversInstallCommand),
			'Select a hub to install to.', 'command-line-hub-id', { useConfigDefault: true })
	})

	it('uses channel from command line if specified', async () => {
		await expect(DriversInstallCommand.run(['--channel', 'command-line-channel-id'])).resolves.not.toThrow()

		expect(selectFromListMock).toHaveBeenCalledTimes(0)
		expect(chooseDriverFromChannelMock).toHaveBeenCalledWith(expect.any(DriversInstallCommand),
			'command-line-channel-id', undefined)
	})
})
