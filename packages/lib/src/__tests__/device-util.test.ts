import { Component, Device } from '@smartthings/core-sdk'

import { APICommand } from '../api-command.js'
import { stringTranslateToId } from '../command-util.js'
import { chooseComponent, chooseDevice } from '../device-util.js'
import { selectFromList } from '../select.js'


jest.mock('../command-util')
jest.mock('../select')

describe('device-util', () => {
	const listDevicesMock = jest.fn()
	const client = { devices: { list: listDevicesMock } }
	const command = { client } as unknown as APICommand<typeof APICommand.flags>

	const selectFromListMock = jest.mocked(selectFromList)
	const stringTranslateToIdMock = jest.mocked(stringTranslateToId)

	describe('chooseDevice', () => {
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

	describe('chooseComponent', () => {
		const components = [{ id: 'componentId' }] as Component[]

		it('returns "main" by default if components are empty', async () => {
			expect(await chooseComponent(command, 'command-line-component-id')).toBe('main')
			expect(await chooseComponent(command, 'command-line-component-id', [])).toBe('main')
		})

		it('uses components as listItems when prompting', async () => {
			await chooseComponent(command, 'command-line-component-id', components)

			const listFunction = stringTranslateToIdMock.mock.calls[0][2]
			expect(await listFunction()).toStrictEqual(components)
		})

		it('calls prompt functions with correct config', async () => {
			selectFromListMock.mockResolvedValueOnce('componentId')
			stringTranslateToIdMock.mockResolvedValueOnce('componentId')

			expect(await chooseComponent(command, 'command-line-component-id', components)).toBe('componentId')

			const expectedConfig = expect.objectContaining({
				itemName: 'component',
				primaryKeyName: 'id',
				sortKeyName: 'id',
				listTableFieldDefinitions: [{ label: 'Id', value: expect.any(Function) }],
			})

			expect(stringTranslateToIdMock).toBeCalledWith(
				expectedConfig,
				'command-line-component-id',
				expect.any(Function),
			)

			expect(selectFromListMock).toBeCalledWith(
				expect.anything(),
				expectedConfig,
				expect.objectContaining({
					preselectedId: 'componentId',
					listItems: expect.any(Function),
					autoChoose: true,
				}),
			)
		})
	})
})
