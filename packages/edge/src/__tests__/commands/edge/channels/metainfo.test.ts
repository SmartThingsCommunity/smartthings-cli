import { ChannelsEndpoint, DriverChannelDetails, EdgeDriver } from '@smartthings/core-sdk'

import { CustomCommonOutputProducer, DefaultTableGenerator, outputItemOrList } from '@smartthings/cli-lib'

import ChannelsMetaInfoCommand from '../../../../commands/edge/channels/metainfo.js'
import { buildTableOutput } from '../../../../lib/commands/drivers-util.js'
import { chooseChannel } from '../../../../lib/commands/channels-util.js'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputItemOrList: jest.fn(),
	}
})
jest.mock('../../../../../src/lib/commands/channels-util')
jest.mock('../../../../../src/lib/commands/drivers-util')

describe('ChannelsMetaInfoCommand', () => {
	const outputItemOrListMock = jest.mocked(outputItemOrList)

	const chooseChannelMock = jest.mocked(chooseChannel).mockResolvedValue('resolved-channel-id')

	const listAssignedDriversSpy = jest.spyOn(ChannelsEndpoint.prototype, 'listAssignedDrivers')
	const getDriverChannelMetaInfoSpy = jest.spyOn(ChannelsEndpoint.prototype, 'getDriverChannelMetaInfo')

	it('uses outputItemOrList', async () => {
		await expect(ChannelsMetaInfoCommand.run([])).resolves.not.toThrow()

		expect(chooseChannelMock).toHaveBeenCalledTimes(1)
		expect(chooseChannelMock).toHaveBeenCalledWith(expect.any(ChannelsMetaInfoCommand),
			'Choose a channel to get meta info for.', undefined, { useConfigDefault: true })
		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(ChannelsMetaInfoCommand),
			expect.objectContaining({ primaryKeyName: 'driverId' }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('passes channel from command line to chooseChannel', async () => {
		await expect(ChannelsMetaInfoCommand.run(['--channel=channel-id-from-cmd-line']))
			.resolves.not.toThrow()

		expect(chooseChannelMock).toHaveBeenCalledTimes(1)
		expect(chooseChannelMock).toHaveBeenCalledWith(expect.any(ChannelsMetaInfoCommand),
			'Choose a channel to get meta info for.', 'channel-id-from-cmd-line', { useConfigDefault: true })
		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
	})

	describe('listDriversMetaInfo', () => {
		it('returns empty list when no drivers assigned to channel', async () => {
			await expect(ChannelsMetaInfoCommand.run([])).resolves.not.toThrow()

			expect(outputItemOrListMock).toHaveBeenCalledTimes(1)

			const listDriversMetaInfo = outputItemOrListMock.mock.calls[0][3] as () => Promise<EdgeDriver[]>
			listAssignedDriversSpy.mockResolvedValueOnce([])

			expect(await listDriversMetaInfo()).toEqual([])

			expect(listAssignedDriversSpy).toHaveBeenCalledTimes(1)
			expect(listAssignedDriversSpy).toHaveBeenCalledWith('resolved-channel-id')
			expect(getDriverChannelMetaInfoSpy).toHaveBeenCalledTimes(0)
		})

		it('combines meta info for all drivers in a channel', async () => {
			await expect(ChannelsMetaInfoCommand.run([])).resolves.not.toThrow()

			expect(outputItemOrListMock).toHaveBeenCalledTimes(1)

			const listDriversMetaInfo = outputItemOrListMock.mock.calls[0][3] as () => Promise<EdgeDriver[]>
			const assignedDrivers = [
				{ driverId: 'assigned-driver-1' },
				{ driverId: 'assigned-driver-2' },
			] as DriverChannelDetails[]
			listAssignedDriversSpy.mockResolvedValueOnce(assignedDrivers)
			const metaInfo1 = { driverId: 'driver-1-with-meta-info-id' } as EdgeDriver
			const metaInfo2 = { driverId: 'driver-2-with-meta-info-id' } as EdgeDriver
			getDriverChannelMetaInfoSpy.mockResolvedValueOnce(metaInfo1)
			getDriverChannelMetaInfoSpy.mockResolvedValueOnce(metaInfo2)

			expect(await listDriversMetaInfo()).toStrictEqual([metaInfo1, metaInfo2])

			expect(listAssignedDriversSpy).toHaveBeenCalledTimes(1)
			expect(listAssignedDriversSpy).toHaveBeenCalledWith('resolved-channel-id')
			expect(getDriverChannelMetaInfoSpy).toHaveBeenCalledTimes(2)
			expect(getDriverChannelMetaInfoSpy).toHaveBeenCalledWith('resolved-channel-id', 'assigned-driver-1')
			expect(getDriverChannelMetaInfoSpy).toHaveBeenCalledWith('resolved-channel-id', 'assigned-driver-2')
		})
	})

	test('get item function uses channels.getDriverChannelMetaInfo', async () => {
		await expect(ChannelsMetaInfoCommand.run(['id-from-command-line'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		const driver = { driverId: 'driver-id' } as EdgeDriver
		getDriverChannelMetaInfoSpy.mockResolvedValueOnce(driver)

		expect(await getFunction('resolved-driver-id')).toBe(driver)

		expect(getDriverChannelMetaInfoSpy).toHaveBeenCalledTimes(1)
		expect(getDriverChannelMetaInfoSpy).toHaveBeenCalledWith('resolved-channel-id', 'resolved-driver-id')
	})

	it('uses buildTableOutput from drivers-util', async () => {
		await expect(ChannelsMetaInfoCommand.run(['id-from-command-line'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)

		const config = outputItemOrListMock.mock.calls[0][1] as CustomCommonOutputProducer<EdgeDriver>
		const driver = { driverId: 'driver-id' } as EdgeDriver

		const buildTableOutputMock = jest.mocked(buildTableOutput).mockReturnValueOnce('table output')

		expect(config.buildTableOutput(driver)).toBe('table output')

		expect(buildTableOutputMock).toHaveBeenCalledTimes(1)
		expect(buildTableOutputMock).toHaveBeenCalledWith(expect.any(DefaultTableGenerator), driver)
	})
})
