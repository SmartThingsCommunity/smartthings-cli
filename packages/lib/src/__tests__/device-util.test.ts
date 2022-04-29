import { Device } from '@smartthings/core-sdk'

import { APICommand } from '../api-command'
import { stringTranslateToId } from '../command-util'
import { chooseDevice } from '../device-util'
import { selectFromList } from '../select'


jest.mock('../command-util')
jest.mock('../select')

describe('device-util', () => {
	describe('chooseDevice', () => {
		const selectFromListMock = jest.mocked(selectFromList)

		const listDevicesMock = jest.fn()
		const client = { devices: { list: listDevicesMock } }
		const command = { client } as unknown as APICommand<typeof APICommand.flags>

		const stringTranslateToIdMock = jest.mocked(stringTranslateToId)

		it('proxies correctly to selectFromList', async () => {
			selectFromListMock.mockImplementation(async () => 'chosen-device-id')

			expect(await chooseDevice(command, 'command-line-device-id')).toBe('chosen-device-id')

			expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
			expect(selectFromListMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledWith(command,
				expect.objectContaining({ primaryKeyName: 'deviceId', sortKeyName: 'label' }),
				expect.objectContaining({ preselectedId: 'command-line-device-id' }))

			const listItems = selectFromListMock.mock.calls[0][2].listItems

			const list = [{ deviceId: 'listed-device-id' }] as Device[]
			listDevicesMock.mockResolvedValueOnce(list)

			expect(await listItems()).toStrictEqual(list)

			expect(listDevicesMock).toHaveBeenCalledTimes(1)
			expect(listDevicesMock).toHaveBeenCalledWith(undefined)
		})

		it('passes on deviceListOptions to list', async () => {
			selectFromListMock.mockImplementation(async () => 'chosen-device-id')
			const deviceListOptions = { locationId: 'locationId' }

			expect(await chooseDevice(command, 'command-line-device-id', { deviceListOptions })).toBe('chosen-device-id')

			expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
			expect(selectFromListMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledWith(command,
				expect.objectContaining({ primaryKeyName: 'deviceId', sortKeyName: 'label' }),
				expect.objectContaining({ preselectedId: 'command-line-device-id' }))

			const listItems = selectFromListMock.mock.calls[0][2].listItems

			const list = [{ deviceId: 'listed-device-id' }] as Device[]
			listDevicesMock.mockResolvedValueOnce(list)

			expect(await listItems()).toStrictEqual(list)

			expect(listDevicesMock).toHaveBeenCalledTimes(1)
			expect(listDevicesMock).toHaveBeenCalledWith(deviceListOptions)
		})

		it('filters items if requested', async () => {
			selectFromListMock.mockImplementation(async () => 'chosen-device-id')
			const deviceListFilter = (device: Device): boolean => device.deviceId !== 'skip-me'

			expect(await chooseDevice(command, 'command-line-device-id', { deviceListFilter })).toBe('chosen-device-id')

			expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
			expect(selectFromListMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledWith(command,
				expect.objectContaining({ primaryKeyName: 'deviceId', sortKeyName: 'label' }),
				expect.objectContaining({ preselectedId: 'command-line-device-id' }))

			const listItems = selectFromListMock.mock.calls[0][2].listItems

			const list = [
				{ deviceId: 'listed-device-id' },
				{ deviceId: 'skip-me' },
				{ deviceId: 'keep-me' },
			] as Device[]
			listDevicesMock.mockResolvedValueOnce(list)

			const expected = [
				{ deviceId: 'listed-device-id' },
				{ deviceId: 'keep-me' },
			]
			expect(await listItems()).toStrictEqual(expected)

			expect(listDevicesMock).toHaveBeenCalledTimes(1)
			expect(listDevicesMock).toHaveBeenCalledWith(undefined)
		})

		it('translates input from index if allowed', async () => {
			stringTranslateToIdMock.mockResolvedValueOnce('translated-id')
			selectFromListMock.mockImplementation(async () => 'chosen-device-id')

			expect(await chooseDevice(command, 'command-line-device-id', { allowIndex: true }))
				.toBe('chosen-device-id')

			expect(stringTranslateToIdMock).toHaveBeenCalledTimes(1)
			expect(stringTranslateToIdMock).toHaveBeenCalledWith(
				expect.objectContaining({ primaryKeyName: 'deviceId', sortKeyName: 'label' }),
				'command-line-device-id', expect.any(Function))
			expect(selectFromListMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledWith(command,
				expect.objectContaining({ primaryKeyName: 'deviceId', sortKeyName: 'label' }),
				expect.objectContaining({ preselectedId: 'translated-id' }))
		})
	})
})
