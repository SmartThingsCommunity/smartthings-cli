import inquirer from 'inquirer'
import {
	APICommand,
	APIOrganizationCommand,
	FileInputProcessor,
	outputListing,
	selectFromList,
} from '@smartthings/cli-lib'
import VirtualDevicesCommand, {
	chooseDeviceName,
	chooseDeviceProfileDefinition,
	chooseDevicePrototype,
	chooseRoom,
} from '../../../commands/devices/virtual'
import { chooseDeviceProfile } from '../../../commands/deviceprofiles'
import { Device, DeviceIntegrationType, DeviceProfile, DeviceProfileStatus, DevicesEndpoint } from '@smartthings/core-sdk'


jest.mock('../../../commands/deviceprofiles')

describe('chooseDeviceName function', () => {
	const command = { } as unknown as APICommand<typeof APICommand.flags>

	it('choose with from prompt', async () => {
		const promptSpy = jest.spyOn(inquirer, 'prompt')
		promptSpy.mockResolvedValue({ deviceName: 'Device Name' })

		const value = await chooseDeviceName(command)
		expect(promptSpy).toHaveBeenCalledTimes(1)
		expect(promptSpy).toHaveBeenCalledWith({
			type: 'input', name: 'deviceName',
			message: 'Device Name:',
		})
		expect(value).toBeDefined()
		expect(value).toBe('Device Name')
	})

	it('choose with default', async () => {
		const promptSpy = jest.spyOn(inquirer, 'prompt')
		promptSpy.mockResolvedValue({ deviceName: 'Another Device Name' })

		const value = await chooseDeviceName(command, 'Device Name')
		expect(promptSpy).toHaveBeenCalledTimes(0)
		expect(value).toBeDefined()
		expect(value).toBe('Device Name')
	})
})

describe('chooseRoom function', () => {
	const selectFromListMock = jest.mocked(selectFromList)
	const listRoomsMock = jest.fn()
	const client = { rooms: { list: listRoomsMock } }
	const command = { client } as unknown as APICommand<typeof APICommand.flags>

	it('choose room from prompt', async () => {
		selectFromListMock.mockResolvedValueOnce('room-id')

		const value = await chooseRoom(command, 'location-id', undefined, true)

		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ primaryKeyName: 'roomId', sortKeyName: 'name' }),
			expect.objectContaining({ autoChoose: true }))
		expect(value).toBeDefined()
		expect(value).toBe('room-id')
	})

	it('choose room with default', async () => {
		selectFromListMock.mockResolvedValueOnce('room-id')

		const value = await chooseRoom(command, 'location-id', 'room-id', true)

		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ primaryKeyName: 'roomId', sortKeyName: 'name' }),
			expect.objectContaining({ autoChoose: true, preselectedId: 'room-id' }))
		expect(value).toBeDefined()
		expect(value).toBe('room-id')
	})
})

describe('chooseDeviceProfileDefinition function', () => {
	const chooseDeviceProfileMock = jest.mocked(chooseDeviceProfile)
	const command = { } as unknown as APIOrganizationCommand<typeof APIOrganizationCommand.flags>

	it('choose profile ID from prompt', async() => {
		chooseDeviceProfileMock.mockResolvedValueOnce('device-profile-id')

		const value = await chooseDeviceProfileDefinition(command)

		expect(chooseDeviceProfileMock).toHaveBeenCalledTimes(1)
		expect(chooseDeviceProfileMock).toHaveBeenCalledWith(command,
			undefined,
			expect.objectContaining({  allowIndex: true}))
		expect(value).toBeDefined()
		expect(value).toEqual({deviceProfileId: 'device-profile-id', deviceProfile: undefined})
	})

	it('choose profile ID from default', async() => {
		const value = await chooseDeviceProfileDefinition(command, 'device-profile-id')

		expect(chooseDeviceProfileMock).toHaveBeenCalledTimes(0)
		expect(value).toBeDefined()
		expect(value).toEqual({deviceProfileId: 'device-profile-id', deviceProfile: undefined})
	})

	it('choose definition from file argument', async() => {
		const deviceProfile: DeviceProfile = {
			id: 'device-profile-id',
			name: 'name',
			components: [],
			status: DeviceProfileStatus.PUBLISHED,
		}

		const fileSpy = jest.spyOn(FileInputProcessor.prototype, 'read').mockResolvedValueOnce(deviceProfile)

		const value = await chooseDeviceProfileDefinition(command, undefined, 'device-profile-file')

		expect(chooseDeviceProfileMock).toHaveBeenCalledTimes(0)
		expect(fileSpy).toHaveBeenCalledTimes(1)
		expect(value).toBeDefined()
		expect(value).toEqual({deviceProfileId: undefined, deviceProfile})
	})
})

describe('chooseDevicePrototype function', () => {
	const selectFromListMock = jest.mocked(selectFromList)
	const command = {} as unknown as APICommand<typeof APICommand.flags>

	it('choose from default list prompt', async () => {
		selectFromListMock.mockResolvedValueOnce('VIRTUAL_SWITCH')

		const value = await chooseDevicePrototype(command)

		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({primaryKeyName: 'id', sortKeyName: 'name'}),
			expect.not.objectContaining({preselectedId: 'VIRTUAL_SWITCH'}))
		expect(value).toBeDefined()
		expect(value).toBe('VIRTUAL_SWITCH')
	})

	it('choose with command line value', async () => {
		selectFromListMock.mockResolvedValueOnce('VIRTUAL_SWITCH')

		const value = await chooseDevicePrototype(command, 'VIRTUAL_SWITCH')

		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({primaryKeyName: 'id', sortKeyName: 'name'}),
			expect.objectContaining({preselectedId: 'VIRTUAL_SWITCH'}))
		expect(value).toBeDefined()
		expect(value).toBe('VIRTUAL_SWITCH')
	})

	it('choose from extended list prompt', async () => {
		selectFromListMock.mockResolvedValueOnce('more')
		selectFromListMock.mockResolvedValueOnce('VIRTUAL_CONTACT_SENSOR')

		const value = await chooseDevicePrototype(command)

		expect(selectFromListMock).toHaveBeenCalledTimes(2)
		expect(selectFromListMock).toHaveBeenNthCalledWith(1, command,
			expect.objectContaining({primaryKeyName: 'id', sortKeyName: 'name'}),
			expect.toBeObject())
		expect(selectFromListMock).toHaveBeenNthCalledWith(2, command,
			expect.objectContaining({primaryKeyName: 'id', sortKeyName: 'name'}),
			expect.toBeObject())
		expect(value).toBeDefined()
		expect(value).toBe('VIRTUAL_CONTACT_SENSOR')
	})
})

describe('VirtualDevicesCommand', () => {
	const outputListingMock = jest.mocked(outputListing)
	const devices = [{ deviceId: 'device-id' }] as Device[]
	const listSpy = jest.spyOn(DevicesEndpoint.prototype, 'list').mockResolvedValue(devices)

	it('virtual devices in all locations', async() => {
		await expect(VirtualDevicesCommand.run([])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
	})

	it('use simple fields by default', async() => {
		await expect(VirtualDevicesCommand.run([])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(outputListingMock.mock.calls[0][1].listTableFieldDefinitions)
			.toEqual(['label', 'deviceId'])
	})

	it('include location and room with verbose flag', async() => {
		await expect(VirtualDevicesCommand.run(['--verbose'])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(outputListingMock.mock.calls[0][1].listTableFieldDefinitions)
			.toEqual(['label', 'deviceId', 'location', 'room'])
	})

	it('virtual devices uses location id in list', async() => {
		outputListingMock.mockImplementationOnce(async (_command, _config, _idOrIndex, listFunction) => {
			await listFunction()
		})

		await expect(VirtualDevicesCommand.run(['--location-id=location-id'])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(listSpy).toHaveBeenCalledTimes(1)
		expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({
			type: DeviceIntegrationType.VIRTUAL,
			locationId: ['location-id'],
		}))
	})

	it('virtual devices uses installed app id in list', async() => {
		outputListingMock.mockImplementationOnce(async (_command, _config, _idOrIndex, listFunction) => {
			await listFunction()
		})

		await expect(VirtualDevicesCommand.run(['--installed-app-id=installed-app-id'])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(listSpy).toHaveBeenCalledTimes(1)
		expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({
			type: DeviceIntegrationType.VIRTUAL,
			installedAppId: 'installed-app-id',
		}))
	})
})
