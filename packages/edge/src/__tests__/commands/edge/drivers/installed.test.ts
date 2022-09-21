import { HubdevicesEndpoint, InstalledDriver } from '@smartthings/core-sdk'

import { outputItemOrList } from '@smartthings/cli-lib'

import DriversInstalledCommand from '../../../../commands/edge/drivers/installed'
import { chooseHub } from '../../../../lib/commands/drivers-util'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputItemOrList: jest.fn(),
	}
})
jest.mock('../../../../../src/lib/commands/drivers-util')

describe('DriversInstalledCommand', () => {
	const hub = { name: 'Hub' } as InstalledDriver
	const chooseHubMock = jest.mocked(chooseHub).mockResolvedValue('chosen-hub-id')
	const apiHubsListInstalledSpy = jest.spyOn(HubdevicesEndpoint.prototype, 'listInstalled').mockResolvedValue([hub])
	const apiHubsGetInstalledSpy = jest.spyOn(HubdevicesEndpoint.prototype, 'getInstalled').mockResolvedValue(hub)
	const outputItemOrListMock = jest.mocked(outputItemOrList)

	afterEach(() => {
		jest.clearAllMocks()
	})

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

	test('list function', async () => {
		await expect(DriversInstalledCommand.run(['--device', 'cmd-line-device-id'])).resolves.not.toThrow()

		expect(chooseHubMock).toHaveBeenCalledTimes(1)
		expect(chooseHubMock).toHaveBeenCalledWith(expect.any(DriversInstalledCommand),
			'Select a hub.', undefined, { allowIndex: true, useConfigDefault: true })

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)

		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toStrictEqual([hub])

		expect(apiHubsListInstalledSpy).toHaveBeenCalledTimes(1)
		expect(apiHubsListInstalledSpy).toHaveBeenCalledWith('chosen-hub-id', 'cmd-line-device-id')
	})

	test('get function', async () => {
		await expect(DriversInstalledCommand.run(['cmd-line-driver-id'])).resolves.not.toThrow()

		expect(chooseHubMock).toHaveBeenCalledTimes(1)
		expect(chooseHubMock).toHaveBeenCalledWith(expect.any(DriversInstalledCommand),
			'Select a hub.', undefined, { allowIndex: true, useConfigDefault: true })

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		expect(await getFunction('chosen-device-id')).toBe(hub)

		expect(apiHubsGetInstalledSpy).toHaveBeenCalledTimes(1)
		expect(apiHubsGetInstalledSpy).toHaveBeenCalledWith('chosen-hub-id', 'chosen-device-id')
	})
})
