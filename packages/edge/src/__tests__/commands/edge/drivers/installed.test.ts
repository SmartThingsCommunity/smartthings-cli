import { HubdevicesEndpoint, InstalledDriver, SmartThingsClient } from '@smartthings/core-sdk'

import { outputItemOrList } from '@smartthings/cli-lib'

import DriversInstalledCommand from '../../../../commands/edge/drivers/installed.js'
import { withChannelNames, WithNamedChannel } from '../../../../lib/commands/channels-util.js'
import { chooseHub } from '../../../../lib/commands/drivers-util.js'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputItemOrList: jest.fn(),
	}
})
jest.mock('../../../../../src/lib/commands/channels-util')
jest.mock('../../../../../src/lib/commands/drivers-util')

describe('DriversInstalledCommand', () => {
	const driver1 = { name: 'Driver 1' } as InstalledDriver
	const driver2 = { name: 'Driver 2' } as InstalledDriver
	const driver1WithChannelName = { ...driver1, channelName: 'Channel 1' } as InstalledDriver & WithNamedChannel
	const driver2WithChannelName = { ...driver2, channelName: 'Channel 2' } as InstalledDriver & WithNamedChannel
	const chooseHubMock = jest.mocked(chooseHub).mockResolvedValue('chosen-hub-id')
	const apiListInstalledSpy = jest.spyOn(HubdevicesEndpoint.prototype, 'listInstalled').mockResolvedValue([driver1])
	const apiGetInstalledSpy = jest.spyOn(HubdevicesEndpoint.prototype, 'getInstalled').mockResolvedValue(driver1)
	const outputItemOrListMock = jest.mocked(outputItemOrList)

	it('uses outputItemOrList', async () => {
		await expect(DriversInstalledCommand.run([])).resolves.not.toThrow()

		expect(chooseHubMock).toHaveBeenCalledTimes(1)
		expect(chooseHubMock).toHaveBeenCalledWith(expect.any(DriversInstalledCommand),
			'Select a hub.', undefined, { allowIndex: true, useConfigDefault: true })

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(DriversInstalledCommand),
			expect.objectContaining({ primaryKeyName: 'driverId' }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('uses hub id from command line', async () => {
		await expect(DriversInstalledCommand.run(['--hub', 'cmd-line-hub-id'])).resolves.not.toThrow()

		expect(chooseHubMock).toHaveBeenCalledTimes(1)
		expect(chooseHubMock).toHaveBeenCalledWith(expect.any(DriversInstalledCommand),
			'Select a hub.', 'cmd-line-hub-id', { allowIndex: true, useConfigDefault: true })

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
	})

	it('includes channel name with verbose flag', async () => {
		await expect(DriversInstalledCommand.run(['--verbose'])).resolves.not.toThrow()

		expect(chooseHubMock).toHaveBeenCalledTimes(1)

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(DriversInstalledCommand),
			expect.objectContaining({
				primaryKeyName: 'driverId',
				tableFieldDefinitions: expect.arrayContaining(['channelName']),
				listTableFieldDefinitions: expect.arrayContaining(['channelName']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
	})

	describe('list function', () => {
		const withChannelNamesMock = jest.mocked(withChannelNames)

		it('calls listInstalled', async () => {
			await expect(DriversInstalledCommand.run(['--device', 'cmd-line-device-id'])).resolves.not.toThrow()

			expect(outputItemOrListMock).toHaveBeenCalledTimes(1)

			const listFunction = outputItemOrListMock.mock.calls[0][3]

			expect(await listFunction()).toStrictEqual([driver1])

			expect(withChannelNamesMock).toHaveBeenCalledTimes(0)
			expect(apiListInstalledSpy).toHaveBeenCalledTimes(1)
			expect(apiListInstalledSpy).toHaveBeenCalledWith('chosen-hub-id', 'cmd-line-device-id')
		})

		it('uses withChannelNames in verbose mode', async () => {
			await expect(DriversInstalledCommand.run(['--verbose'])).resolves.not.toThrow()

			expect(outputItemOrListMock).toHaveBeenCalledTimes(1)

			const listFunction = outputItemOrListMock.mock.calls[0][3]

			apiListInstalledSpy.mockResolvedValueOnce([driver1, driver2])
			withChannelNamesMock.mockResolvedValueOnce([driver1WithChannelName, driver2WithChannelName])

			expect(await listFunction()).toStrictEqual([driver1WithChannelName, driver2WithChannelName])

			expect(apiListInstalledSpy).toHaveBeenCalledTimes(1)
			expect(apiListInstalledSpy).toHaveBeenCalledWith('chosen-hub-id', undefined)
			expect(withChannelNamesMock).toHaveBeenCalledTimes(1)
			expect(withChannelNamesMock).toHaveBeenCalledWith(expect.any(SmartThingsClient), [driver1, driver2])
		})
	})

	describe('get function', () => {
		const withChannelNamesMock = jest.mocked(withChannelNames) as unknown as
			jest.Mock<Promise<InstalledDriver & WithNamedChannel>, [SmartThingsClient, InstalledDriver]>

		it('calls getInstalled', async () => {
			await expect(DriversInstalledCommand.run(['cmd-line-driver-id'])).resolves.not.toThrow()

			expect(outputItemOrListMock).toHaveBeenCalledTimes(1)

			const getFunction = outputItemOrListMock.mock.calls[0][4]

			expect(await getFunction('chosen-device-id')).toBe(driver1)

			expect(withChannelNamesMock).toHaveBeenCalledTimes(0)
			expect(apiGetInstalledSpy).toHaveBeenCalledTimes(1)
			expect(apiGetInstalledSpy).toHaveBeenCalledWith('chosen-hub-id', 'chosen-device-id')
		})

		it('uses withChannelNames in verbose mode', async () => {
			await expect(DriversInstalledCommand.run(['cmd-line-driver-id', '--verbose'])).resolves.not.toThrow()

			expect(outputItemOrListMock).toHaveBeenCalledTimes(1)

			const getFunction = outputItemOrListMock.mock.calls[0][4]
			withChannelNamesMock.mockResolvedValueOnce(driver1WithChannelName)

			expect(await getFunction('chosen-device-id')).toBe(driver1WithChannelName)

			expect(apiGetInstalledSpy).toHaveBeenCalledTimes(1)
			expect(apiGetInstalledSpy).toHaveBeenCalledWith('chosen-hub-id', 'chosen-device-id')
			expect(withChannelNamesMock).toHaveBeenCalledTimes(1)
			expect(withChannelNamesMock).toHaveBeenCalledWith(expect.any(SmartThingsClient), driver1)
		})
	})
})
