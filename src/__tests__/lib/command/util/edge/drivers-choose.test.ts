import { jest } from '@jest/globals'

import type { EdgeDriver } from '@smartthings/core-sdk'

import type { APICommand } from '../../../../../lib/command/api-command.js'
import type { DriverChoice } from '../../../../../lib/command/util/drivers-choose.js'
import type {
	DriverChannelDetailsWithName,
	listAssignedDriversWithNames,
	listDrivers,
} from '../../../../../lib/command/util/edge-drivers.js'
import type { ChooseFunction, createChooseFn } from '../../../../../lib/command/util/util-util.js'


const createChooseFnMock = jest.fn<typeof createChooseFn<DriverChoice>>()
jest.unstable_mockModule('../../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))

const listAssignedDriversWithNamesMock = jest.fn<typeof listAssignedDriversWithNames>()
const listDriversMock = jest.fn<typeof listDrivers>()
jest.unstable_mockModule('../../../../../lib/command/util/edge-drivers.js', () => ({
	listAssignedDriversWithNames: listAssignedDriversWithNamesMock,
	listDrivers: listDriversMock,
}))


const { chooseDriverFn, chooseDriverFromChannelFn } = await import('../../../../../lib/command/util/drivers-choose.js')


const drivers = [{ driverId: 'edge-driver-id' }] as EdgeDriver[]

const command = { client: { drivers: {} } } as APICommand

describe('chooseDriverFn', () => {
	const chooseDriverMock = jest.fn<ChooseFunction<DriverChoice>>()
	createChooseFnMock.mockReturnValue(chooseDriverMock)

	it('does not include all organizations by default', async () => {
		expect(chooseDriverFn()).toBe(chooseDriverMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ itemName: 'driver' }),
			expect.any(Function),
		)

		const listItems = createChooseFnMock.mock.calls[0][1]

		listDriversMock.mockResolvedValueOnce(drivers)

		expect(await listItems(command)).toBe(drivers)

		expect(listDriversMock).toHaveBeenCalledExactlyOnceWith(command.client, undefined)
	})

	it('requests all organizations when specified', async () => {
		expect(chooseDriverFn({ includeAllOrganizations: true })).toBe(chooseDriverMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ itemName: 'driver' }),
			expect.any(Function),
		)

		const listItems = createChooseFnMock.mock.calls[0][1]

		listDriversMock.mockResolvedValueOnce(drivers)

		expect(await listItems(command)).toBe(drivers)

		expect(listDriversMock).toHaveBeenCalledExactlyOnceWith(command.client, true)
	})
})

test('chooseDriverFromChannelFn', async () => {
	const createChooseFnForDriverFromChannelMock = createChooseFnMock as unknown as
		jest.Mock<typeof createChooseFn<DriverChannelDetailsWithName>>
	const chooseDriverFromChannelMock = jest.fn<ChooseFunction<DriverChannelDetailsWithName>>()
	createChooseFnForDriverFromChannelMock.mockReturnValue(chooseDriverFromChannelMock)

	expect(chooseDriverFromChannelFn('channel-id')).toBe(chooseDriverFromChannelMock)

	expect(createChooseFnForDriverFromChannelMock).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({ itemName: 'driver' }),
		expect.any(Function),
	)

	const listItems = createChooseFnForDriverFromChannelMock.mock.calls[0][1]
	const drivers = [{ driverId: 'edge-driver-id' }] as DriverChannelDetailsWithName[]
	listAssignedDriversWithNamesMock.mockResolvedValueOnce(drivers)

	expect(await listItems(command)).toBe(drivers)
})
