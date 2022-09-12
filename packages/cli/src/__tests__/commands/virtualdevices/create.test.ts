import { inputAndOutputItem } from '@smartthings/cli-lib'
import { VirtualDeviceCreateRequest, VirtualDevicesEndpoint } from '@smartthings/core-sdk'
import VirtualDeviceCreateCommand from '../../../commands/virtualdevices/create'
import { chooseLocation } from '../../../commands/locations'
import { chooseRoom } from '../../../lib/commands/locations/rooms-util'
import { chooseDeviceName, chooseDeviceProfileDefinition } from '../../../lib/commands/virtualdevices-util'


jest.mock('../../../commands/locations')
jest.mock('../../../lib/commands/locations/rooms-util')
jest.mock('../../../lib/commands/virtualdevices-util')

describe('VirtualDeviceCreateCommand', () => {
	const mockInputAndOutputItem = jest.mocked(inputAndOutputItem)
	const createSpy = jest.spyOn(VirtualDevicesEndpoint.prototype, 'create').mockImplementation()

	it('calls correct endpoint', async () => {
		const createRequest: VirtualDeviceCreateRequest = {
			name: 'Device Name',
			owner: {
				ownerType: 'LOCATION',
				ownerId: 'location-id',
			},
		}

		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, createRequest)
		})

		await expect(VirtualDeviceCreateCommand.run([])).resolves.not.toThrow()
		expect(mockInputAndOutputItem).toBeCalledWith(
			expect.any(VirtualDeviceCreateCommand),
			expect.anything(),
			expect.any(Function),
			expect.anything(),
		)
		expect(createSpy).toBeCalledWith(createRequest)
	})

	it('overwrites name, location, and room from command line', async () => {
		const createRequest: VirtualDeviceCreateRequest = {
			name: 'Device Name',
			owner: {
				ownerType: 'LOCATION',
				ownerId: 'location-id',
			},
		}

		const expectedCreateRequest: VirtualDeviceCreateRequest = {
			name: 'NewDeviceName',
			owner: {
				ownerType: 'LOCATION',
				ownerId: 'new-location-id',
			},
			roomId: 'new-room-id',
		}

		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, createRequest)
		})

		await expect(VirtualDeviceCreateCommand.run([
			'--name=NewDeviceName',
			'--location=new-location-id',
			'--room=new-room-id',
		])).resolves.not.toThrow()

		expect(mockInputAndOutputItem).toBeCalledWith(
			expect.any(VirtualDeviceCreateCommand),
			expect.anything(),
			expect.any(Function),
			expect.anything(),
		)
		expect(createSpy).toBeCalledWith(expectedCreateRequest)
	})

	it('command line flag input with profile ID', async () => {
		const mockChooseDeviceName = jest.mocked(chooseDeviceName)
		const mockChooseRoom = jest.mocked(chooseRoom)
		const mockChooseLocation = jest.mocked(chooseLocation)
		const mockChooseDeviceProfileDefinition = jest.mocked(chooseDeviceProfileDefinition)

		const expectedCreateRequest: VirtualDeviceCreateRequest = {
			name: 'DeviceName',
			owner: {
				ownerType: 'LOCATION',
				ownerId: 'location-id',
			},
			roomId: 'room-id',
			deviceProfileId: 'device-profile-id',
		}

		mockChooseDeviceName.mockResolvedValueOnce('DeviceName')
		mockChooseLocation.mockResolvedValueOnce('location-id')
		mockChooseRoom.mockResolvedValueOnce(['room-id', 'location-id'])
		mockChooseDeviceProfileDefinition.mockResolvedValueOnce({ deviceProfileId: 'device-profile-id' })

		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction, inputProcessor) => {
			const data = await inputProcessor.read()
			await actionFunction(undefined, data)
		})

		await expect(VirtualDeviceCreateCommand.run([
			'--name=DeviceName',
			'--location=location-id',
			'--room=room-id',
			'--device-profile=device-profile-id',
		])).resolves.not.toThrow()

		expect(mockChooseDeviceName).toBeCalledWith(expect.any(VirtualDeviceCreateCommand), 'DeviceName')
		expect(mockChooseLocation).toBeCalledWith(expect.any(VirtualDeviceCreateCommand), 'location-id', true)
		expect(mockChooseRoom).toBeCalledWith(expect.any(VirtualDeviceCreateCommand), 'location-id', 'room-id', true)
		expect(mockChooseDeviceProfileDefinition).toBeCalledWith(expect.any(VirtualDeviceCreateCommand), 'device-profile-id', undefined)

		expect(createSpy).toBeCalledWith(expectedCreateRequest)
	})

	it('command line flag input with profile definition', async () => {
		const mockChooseDeviceName = jest.mocked(chooseDeviceName)
		const mockChooseRoom = jest.mocked(chooseRoom)
		const mockChooseLocation = jest.mocked(chooseLocation)
		const mockChooseDeviceProfileDefinition = jest.mocked(chooseDeviceProfileDefinition)

		const expectedCreateRequest: VirtualDeviceCreateRequest = {
			name: 'DeviceName',
			owner: {
				ownerType: 'LOCATION',
				ownerId: 'location-id',
			},
			roomId: 'room-id',
			deviceProfile: {},
		}

		mockChooseDeviceName.mockResolvedValueOnce('DeviceName')
		mockChooseLocation.mockResolvedValueOnce('location-id')
		mockChooseRoom.mockResolvedValueOnce(['room-id', 'location-id'])
		mockChooseDeviceProfileDefinition.mockResolvedValueOnce({ deviceProfile: {} })

		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction, inputProcessor) => {
			const data = await inputProcessor.read()
			await actionFunction(undefined, data)
		})

		await expect(VirtualDeviceCreateCommand.run([
			'--name=DeviceName',
			'--location=location-id',
			'--room=room-id',
			'--device-profile-file=device-profile-filename',
		])).resolves.not.toThrow()

		expect(mockChooseDeviceName).toBeCalledWith(expect.any(VirtualDeviceCreateCommand), 'DeviceName')
		expect(mockChooseLocation).toBeCalledWith(expect.any(VirtualDeviceCreateCommand), 'location-id', true)
		expect(mockChooseRoom).toBeCalledWith(expect.any(VirtualDeviceCreateCommand), 'location-id', 'room-id', true)
		expect(mockChooseDeviceProfileDefinition).toBeCalledWith(expect.any(VirtualDeviceCreateCommand), undefined, 'device-profile-filename')

		expect(createSpy).toBeCalledWith(expectedCreateRequest)
	})

})
