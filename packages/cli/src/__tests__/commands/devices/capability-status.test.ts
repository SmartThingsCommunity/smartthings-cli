import { chooseComponent, chooseDevice, formatAndWriteItem, selectFromList, stringTranslateToId } from '@smartthings/cli-lib'
import { CapabilityStatus, Device, DevicesEndpoint } from '@smartthings/core-sdk'
import DeviceCapabilityStatusCommand from '../../../commands/devices/capability-status.js'


const DEVICE = {
	deviceId: 'deviceId',
	components: [{
		id: 'componentId',
		capabilities: [{
			id: 'capabilityId',
		}],
	}],
} as unknown as Device

const CAPABILITY_STATUS = {
	attribute: {
		value: 'value',
	},
} as CapabilityStatus

describe('DeviceCapabilityStatusCommand', () => {
	const getDevicesSpy = jest.spyOn(DevicesEndpoint.prototype, 'get').mockResolvedValue(DEVICE)
	const capabilityStatusSpy = jest.spyOn(DevicesEndpoint.prototype, 'getCapabilityStatus').mockResolvedValue(CAPABILITY_STATUS)

	const chooseDeviceMock = jest.mocked(chooseDevice).mockResolvedValue('deviceId')
	const chooseComponentMock = jest.mocked(chooseComponent).mockResolvedValue('componentId')
	const stringTranslateToIdMock = jest.mocked(stringTranslateToId).mockResolvedValue('capabilityId')
	const selectFromListMock = jest.mocked(selectFromList).mockResolvedValue('capabilityId')
	const formatAndWriteItemMock = jest.mocked(formatAndWriteItem)

	it('prompts user to choose a device', async () => {
		await expect(DeviceCapabilityStatusCommand.run(['deviceId'])).resolves.not.toThrow()

		expect(chooseDeviceMock).toBeCalledWith(
			expect.any(DeviceCapabilityStatusCommand),
			'deviceId',
			expect.objectContaining({
				allowIndex: true,
			}),
		)
	})

	it('prompts user to choose component from device', async () => {
		await expect(DeviceCapabilityStatusCommand.run(['deviceId', 'componentId'])).resolves.not.toThrow()

		expect(getDevicesSpy).toBeCalledWith('deviceId')
		expect(chooseComponentMock).toBeCalledWith(
			expect.any(DeviceCapabilityStatusCommand),
			'componentId',
			DEVICE.components,
		)
	})

	it('throws error if component not found or has no capabilities', async () => {
		chooseComponentMock.mockResolvedValueOnce('componentIdNotFound')

		await expect(DeviceCapabilityStatusCommand.run([])).rejects.toThrow('no capabilities found for component')

		const noCapabilitiesDevice = { deviceId: 'noCapabilities' } as Device
		getDevicesSpy.mockResolvedValueOnce(noCapabilitiesDevice)

		await expect(DeviceCapabilityStatusCommand.run([])).rejects.toThrow('no capabilities found for component')
	})

	it('prompts user to select capability from component', async () => {
		await expect(DeviceCapabilityStatusCommand.run(['deviceId', 'componentId', 'capabilityId'])).resolves.not.toThrow()

		const expectedConfig = expect.objectContaining({
			itemName: 'capability',
			primaryKeyName: 'id',
			sortKeyName: 'id',
			listTableFieldDefinitions: ['id'],
		})

		expect(stringTranslateToIdMock).toBeCalledWith(
			expectedConfig,
			'capabilityId',
			expect.any(Function),
		)

		const listFunction = stringTranslateToIdMock.mock.calls[0][2]

		await expect(listFunction()).resolves.toStrictEqual(DEVICE.components?.[0].capabilities)

		expect(selectFromListMock).toBeCalledWith(
			expect.any(DeviceCapabilityStatusCommand),
			expectedConfig,
			expect.objectContaining({
				preselectedId: 'capabilityId',
				listItems: expect.any(Function),
			}),
		)
	})

	it('gets capability status and writes output using format function', async () => {
		await expect(DeviceCapabilityStatusCommand.run([])).resolves.not.toThrow()

		expect(capabilityStatusSpy).toBeCalledWith('deviceId', 'componentId', 'capabilityId')
		expect(formatAndWriteItemMock).toBeCalledWith(
			expect.any(DeviceCapabilityStatusCommand),
			expect.objectContaining({
				buildTableOutput: expect.any(Function),
			}),
			CAPABILITY_STATUS,
		)
	})
})
