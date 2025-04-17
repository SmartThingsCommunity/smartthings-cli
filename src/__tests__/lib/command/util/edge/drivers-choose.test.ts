import { jest } from '@jest/globals'

import type { EdgeDriver } from '@smartthings/core-sdk'

import type { APICommand } from '../../../../../lib/command/api-command.js'
import type { DriverChoice } from '../../../../../lib/command/util/drivers-choose.js'
import type { ChooseFunction, createChooseFn } from '../../../../../lib/command/util/util-util.js'
import type { listDrivers } from '../../../../../lib/command/util/edge/drivers-util.js'


const createChooseFnMock = jest.fn<typeof createChooseFn<DriverChoice>>()
jest.unstable_mockModule('../../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))

const listDriversMock = jest.fn<typeof listDrivers>()
jest.unstable_mockModule('../../../../../lib/command/util/edge/drivers-util.js', () => ({
	listDrivers: listDriversMock,
}))


const { chooseDriverFn } = await import('../../../../../lib/command/util/drivers-choose.js')


describe('createDriverFn', () => {
	const createDriverMock = jest.fn<ChooseFunction<DriverChoice>>()
	createChooseFnMock.mockReturnValue(createDriverMock)

	const drivers = [] as EdgeDriver[]

	const command = { client: { drivers: {} } } as APICommand

	it('does not include all organizations by default', async () => {
		expect(chooseDriverFn()).toBe(createDriverMock)

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
		expect(chooseDriverFn({ includeAllOrganizations: true })).toBe(createDriverMock)

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
