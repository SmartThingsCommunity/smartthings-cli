import { inputAndOutputItem } from '@smartthings/cli-lib'
import {
	VirtualDeviceStandardCreateRequest,
	VirtualDevicesEndpoint,
} from '@smartthings/core-sdk'
import VirtualDeviceCreateStandardCommand from '../../../commands/virtualdevices/create-standard'
import { chooseLocation } from '../../../commands/locations'
import { chooseRoom } from '../../../lib/commands/locations/rooms-util'
import { chooseDeviceName, chooseDevicePrototype } from '../../../lib/commands/virtualdevices-util'


jest.mock('../../../commands/locations')
jest.mock('../../../lib/commands/locations/rooms-util')
jest.mock('../../../lib/commands/virtualdevices-util')

describe('VirtualDeviceStandardCreateCommand', () => {
	const mockInputAndOutputItem = jest.mocked(inputAndOutputItem)
	const createSpy = jest.spyOn(VirtualDevicesEndpoint.prototype, 'createStandard').mockImplementation()

	it('calls correct endpoint', async () => {
		const createRequest: VirtualDeviceStandardCreateRequest = {
			name: 'Device Name',
			owner: {
				ownerType: 'LOCATION',
				ownerId: 'location-id',
			},
			prototype: 'VIRTUAL_SWITCH',
		}

		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, createRequest)
		})

		await expect(VirtualDeviceCreateStandardCommand.run([])).resolves.not.toThrow()

		expect(createSpy).toBeCalledWith(createRequest)
	})

	it('overwrites name, location, and room from command line', async () => {
		const createRequest: VirtualDeviceStandardCreateRequest = {
			name: 'Device Name',
			owner: {
				ownerType: 'LOCATION',
				ownerId: 'location-id',
			},
			prototype: 'VIRTUAL_SWITCH',
		}

		const expectedCreateRequest: VirtualDeviceStandardCreateRequest = {
			name: 'NewDeviceName',
			owner: {
				ownerType: 'LOCATION',
				ownerId: 'new-location-id',
			},
			roomId: 'new-room-id',
			prototype: 'VIRTUAL_SWITCH',
		}

		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, createRequest)
		})

		await expect(VirtualDeviceCreateStandardCommand.run([
			'--name=NewDeviceName',
			'--location-id=new-location-id',
			'--room-id=new-room-id',
		])).resolves.not.toThrow()

		expect(createSpy).toBeCalledWith(expectedCreateRequest)
	})

	it('command line flag input', async () => {
		const mockChooseDeviceName = jest.mocked(chooseDeviceName)
		const mockChooseRoom = jest.mocked(chooseRoom)
		const mockChooseLocation = jest.mocked(chooseLocation)
		const mockChooseDevicePrototype = jest.mocked(chooseDevicePrototype)

		const expectedCreateRequest: VirtualDeviceStandardCreateRequest = {
			name: 'DeviceName',
			owner: {
				ownerType: 'LOCATION',
				ownerId: 'location-id',
			},
			roomId: 'room-id',
			prototype: 'VIRTUAL_SWITCH',
		}

		mockChooseDeviceName.mockResolvedValueOnce('DeviceName')
		mockChooseLocation.mockResolvedValueOnce('location-id')
		mockChooseRoom.mockResolvedValueOnce(['room-id', 'location-id'])
		mockChooseDevicePrototype.mockResolvedValueOnce('VIRTUAL_SWITCH')

		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction, inputProcessor) => {
			const data = await inputProcessor.read()
			await actionFunction(undefined, data)
		})

		await expect(VirtualDeviceCreateStandardCommand.run([
			'--name=DeviceName',
			'--location-id=location-id',
			'--room-id=room-id',
			'--prototype=VIRTUAL_SWITCH',
		])).resolves.not.toThrow()

		expect(mockChooseDeviceName).toBeCalledWith(expect.any(VirtualDeviceCreateStandardCommand), 'DeviceName')
		expect(mockChooseLocation).toBeCalledWith(expect.any(VirtualDeviceCreateStandardCommand), 'location-id', true)
		expect(mockChooseRoom).toBeCalledWith(expect.any(VirtualDeviceCreateStandardCommand), 'location-id', 'room-id', true)
		expect(mockChooseDevicePrototype).toBeCalledWith(expect.any(VirtualDeviceCreateStandardCommand), 'VIRTUAL_SWITCH')
		expect(createSpy).toBeCalledWith(expectedCreateRequest)
	})
})
