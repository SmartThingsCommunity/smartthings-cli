import { SmartThingsClient } from '@smartthings/core-sdk'

import { outputList } from '@smartthings/cli-lib'

import { chooseChannel } from '../../../../lib/commands/channels-util'
import { DriverChannelDetailsWithName } from '../../../../lib/commands/drivers-util'
import * as driversUtil from '../../../../lib/commands/drivers-util'
import ChannelsDriversCommand from '../../../../commands/edge/channels/drivers'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputList: jest.fn(),
	}
})
jest.mock('../../../../../src/lib/commands/channels-util')

describe('ChannelsDriversCommand', () => {
	const outputListMock = jest.mocked(outputList)
	const chooseChannelMock = jest.mocked(chooseChannel)
		.mockResolvedValue('chosen-channel-id')

	const driverChannelDetailsList = [] as DriverChannelDetailsWithName[]
	outputListMock.mockResolvedValue(driverChannelDetailsList)

	it('calls outputList to do the work', async () => {
		await expect(ChannelsDriversCommand.run([])).resolves.not.toThrow()

		expect(chooseChannelMock).toHaveBeenCalledTimes(1)
		expect(chooseChannelMock).toHaveBeenCalledWith(expect.any(ChannelsDriversCommand),
			'Select a channel.', undefined,
			{ allowIndex: true, includeReadOnly: true, useConfigDefault: true })
		expect(outputListMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledWith(expect.any(ChannelsDriversCommand),
			expect.objectContaining({
				primaryKeyName: 'channelId',
				sortKeyName: 'name',
				listTableFieldDefinitions: expect.arrayContaining(['name', 'driverId', 'version']),
			}),
			expect.any(Function))
	})

	it('passes predefined id or index to chooseChannel', async () => {
		await expect(ChannelsDriversCommand.run(['id-or-index'])).resolves.not.toThrow()

		expect(chooseChannelMock).toHaveBeenCalledTimes(1)
		expect(chooseChannelMock).toHaveBeenCalledWith(expect.any(ChannelsDriversCommand),
			'Select a channel.', 'id-or-index',
			{ allowIndex: true, includeReadOnly: true, useConfigDefault: true })
		expect(outputListMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledWith(expect.any(ChannelsDriversCommand),
			expect.objectContaining({
				primaryKeyName: 'channelId',
				listTableFieldDefinitions: expect.arrayContaining(['name', 'driverId', 'version']),
			}),
			expect.any(Function))
	})

	it('passes predefined id or index to chooseChannel', async () => {
		await expect(ChannelsDriversCommand.run([])).resolves.not.toThrow()

		expect(chooseChannelMock).toHaveBeenCalledTimes(1)
		expect(chooseChannelMock).toHaveBeenCalledWith(expect.any(ChannelsDriversCommand),
			'Select a channel.', undefined,
			{ allowIndex: true, includeReadOnly: true, useConfigDefault: true })
		expect(outputListMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledWith(expect.any(ChannelsDriversCommand),
			expect.objectContaining({
				primaryKeyName: 'channelId',
				listTableFieldDefinitions: expect.arrayContaining(['name', 'driverId', 'version']),
			}),
			expect.any(Function))

		const getData = outputListMock.mock.calls[0][2]

		const drivers = [{ name: 'driver' }] as DriverChannelDetailsWithName[]
		const listAssignedDriversWithNamesSpy = jest.spyOn(driversUtil, 'listAssignedDriversWithNames')
			.mockResolvedValueOnce(drivers)

		expect(await getData()).toBe(drivers)

		expect(listAssignedDriversWithNamesSpy).toHaveBeenCalledTimes(1)
		expect(listAssignedDriversWithNamesSpy).toHaveBeenCalledWith(expect.any(SmartThingsClient), 'chosen-channel-id')
	})
})
