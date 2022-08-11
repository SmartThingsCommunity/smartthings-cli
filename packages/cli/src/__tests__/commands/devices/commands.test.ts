import { ExitError } from '@oclif/core/lib/errors'
import inquirer from 'inquirer'

import { CapabilitiesEndpoint, Capability, Command, Device, DevicesEndpoint } from '@smartthings/core-sdk'

import { chooseDevice, StdinInputProcessor } from '@smartthings/cli-lib'

import DeviceCommandsCommand from '../../../commands/devices/commands'


// restore inputItem implementation for testing this command
jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		chooseDevice: jest.fn(),
	}
})

jest.mock('inquirer')

const DEVICE = { deviceId: 'deviceId', label: 'Device' } as Device
const OUTLET_DEVICE = {
	deviceId: 'outletDevice',
	label: 'Outlet',
	components: [
		{
			id: 'main',
		},
		{
			id: 'outlet1',
			capabilities: [
				{ id: 'switch' },
				{ id: 'switchLevel' },
			],
		},
	],
} as unknown as Device

describe('DeviceCommandsCommand', () => {
	const getDevicesSpy = jest.spyOn(DevicesEndpoint.prototype, 'get').mockResolvedValue(DEVICE)
	const executeCommandsSpy = jest.spyOn(DevicesEndpoint.prototype, 'executeCommands').mockImplementation()
	const getCapabilitiesSpy = jest.spyOn(CapabilitiesEndpoint.prototype, 'get').mockImplementation()
	const promptSpy = jest.spyOn(inquirer, 'prompt').mockImplementation()
	jest.spyOn(DeviceCommandsCommand.prototype, 'log').mockImplementation()
	jest.spyOn(StdinInputProcessor.prototype, 'hasInput').mockReturnValue(false)

	const chooseDeviceMock = jest.mocked(chooseDevice).mockResolvedValue('deviceId')

	it('only executes commands once', async () => {
		const commandString = 'switch:on()'

		await expect(DeviceCommandsCommand.run(['deviceId', commandString])).resolves.not.toThrow()

		expect(executeCommandsSpy).toBeCalledTimes(1)
	})

	it('prompts user to choose device', async () => {
		const commandString = 'switch:on()'

		await expect(DeviceCommandsCommand.run(['deviceId', commandString])).resolves.not.toThrow()

		expect(chooseDeviceMock).toBeCalledWith(expect.any(DeviceCommandsCommand), 'deviceId')
	})

	describe('command parsing', () => {
		test('capability command', async () => {
			const commandString = 'switch:on()'

			await expect(DeviceCommandsCommand.run(['deviceId', commandString])).resolves.not.toThrow()

			const expectedCommand: Command = {
				capability: 'switch',
				command: 'on',
				component: 'main',
				arguments: [],
			}

			expect(executeCommandsSpy).toBeCalledWith('deviceId', [expectedCommand])
		})

		test('capability command no parens', async () => {
			const commandString = 'switch:off'

			await expect(DeviceCommandsCommand.run(['deviceId', commandString])).resolves.not.toThrow()

			const expectedCommand: Command = {
				capability: 'switch',
				command: 'off',
				component: 'main',
				arguments: [],
			}

			expect(executeCommandsSpy).toBeCalledWith('deviceId', [expectedCommand])
		})

		test('component, capability, command', async () => {
			getDevicesSpy.mockResolvedValueOnce(OUTLET_DEVICE)
			const commandString = 'outlet1:switch:on()'

			await expect(DeviceCommandsCommand.run(['deviceId', commandString])).resolves.not.toThrow()

			const expectedCommand: Command = {
				capability: 'switch',
				command: 'on',
				component: 'outlet1',
				arguments: [],
			}

			expect(executeCommandsSpy).toBeCalledWith('deviceId', [expectedCommand])
		})

		test('capability command one argument', async () => {
			const commandString = 'switchLevel:setLevel(50)'

			await expect(DeviceCommandsCommand.run(['deviceId', commandString])).resolves.not.toThrow()

			const expectedCommand: Command = {
				capability: 'switchLevel',
				command: 'setLevel',
				component: 'main',
				arguments: [50],
			}

			expect(executeCommandsSpy).toBeCalledWith('deviceId', [expectedCommand])
		})

		test('capability command two arguments', async () => {
			const commandString = 'switchLevel:setLevel(50, 15)'

			await expect(DeviceCommandsCommand.run(['deviceId', commandString])).resolves.not.toThrow()

			const expectedCommand: Command = {
				capability: 'switchLevel',
				command: 'setLevel',
				component: 'main',
				arguments: [50, 15],
			}

			expect(executeCommandsSpy).toBeCalledWith('deviceId', [expectedCommand])
		})

		test('only component', async () => {
			getDevicesSpy.mockResolvedValueOnce(OUTLET_DEVICE)
			const commandString = 'outlet1'

			await expect(DeviceCommandsCommand.run(['deviceId', commandString])).resolves.not.toThrow()

			const expectedCommand: Command = {
				capability: '',
				command: '',
				component: 'outlet1',
				arguments: [],
			}

			expect(executeCommandsSpy).toBeCalledWith('deviceId', [expectedCommand])
		})

		test('enter component and skip rest of prompts', async () => {
			getDevicesSpy.mockResolvedValueOnce(OUTLET_DEVICE)
			const switchLevel: Capability = {
				name: 'switch',
				commands: {
					on: {
						name: 'setLevel',
						arguments: [
							{
								name: 'level',
								schema: { type: 'number' },
							},
						],
					},
				},
			}
			getCapabilitiesSpy.mockResolvedValueOnce(switchLevel)
			promptSpy
				.mockResolvedValueOnce({ component: 'outlet1' })
				.mockResolvedValueOnce({ capability: 'switchLevel:setLevel(80)' }) // not currently documented

			await expect(DeviceCommandsCommand.run(['deviceId'])).resolves.not.toThrow()

			const expectedCommand: Command = {
				capability: 'switchLevel',
				command: 'setLevel',
				component: 'outlet1',
				arguments: [80],
			}

			expect(executeCommandsSpy).toBeCalledWith('deviceId', [expectedCommand])
		})

		test('abort if only capability is entered', async () => {
			getDevicesSpy.mockResolvedValueOnce(OUTLET_DEVICE)
			const switchLevel: Capability = {
				name: 'switchLevel',
				commands: {
					setLevel: {
						name: 'setLevel',
						arguments: [
							{
								name: 'level',
								schema: { type: 'number' },
							},
						],
					},
				},
			}
			getCapabilitiesSpy.mockResolvedValueOnce(switchLevel)
			promptSpy
				.mockResolvedValueOnce({ component: 'outlet1' })
				.mockResolvedValueOnce({ capability: 'switchLevel' })
				.mockResolvedValueOnce({ command: '' })

			await expect(DeviceCommandsCommand.run(['deviceId'])).rejects.toThrow(new ExitError(0))
			expect(executeCommandsSpy).toBeCalledTimes(0)
		})

		test('only command', async () => {
			getDevicesSpy.mockResolvedValueOnce(OUTLET_DEVICE)
			const switchLevel: Capability = {
				name: 'switchLevel',
				commands: {
					setLevel: {
						name: 'setLevel',
						arguments: [
							{
								name: 'level',
								schema: { type: 'number' },
							},
						],
					},
				},
			}
			getCapabilitiesSpy.mockResolvedValueOnce(switchLevel)
			promptSpy
				.mockResolvedValueOnce({ component: 'outlet1' })
				.mockResolvedValueOnce({ capability: 'switchLevel' })
				.mockResolvedValueOnce({ command: 'setLevel(30)' })

			await expect(DeviceCommandsCommand.run(['deviceId'])).resolves.not.toThrow()

			const expectedCommand: Command = {
				capability: 'switchLevel',
				command: 'setLevel',
				component: 'outlet1',
				arguments: [30],
			}

			expect(executeCommandsSpy).toBeCalledWith('deviceId', [expectedCommand])
		})
	})
})
