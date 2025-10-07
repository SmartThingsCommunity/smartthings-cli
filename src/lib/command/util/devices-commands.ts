import { type Command, type Component, type CapabilityReference, type Device } from '@smartthings/core-sdk'

import { cancelCommand } from '../../util.js'
import { type APICommand } from '../api-command.js'
import { isIndexArgument } from '../command-util.js'
import { type SmartThingsCommand } from '../smartthings-command.js'
import { optionalStringInput, stringInput } from '../../user-query.js'
import { attributeTypeDisplayString } from './capabilities-util.js'


export const parseArguments = (str: string): (Record<string, unknown> | string | number)[] =>
	JSON.parse(`[${str}]`)

export const parseDeviceCommand = (str: string, componentId?: string, capabilityId?: string): Command => {
	let cmdStr = str
	let args = []
	const pos = str.indexOf('(')
	if (pos > 0) {
		cmdStr = str.slice(0, pos)
		const argStr = str.slice(pos + 1, -1)
		args = JSON.parse(`[${argStr}]`)
	}

	const segments = cmdStr.split(':')

	const component = componentId
		? componentId
		: (segments.length === 2 ? 'main' : segments[0])

	const capability = capabilityId
		? capabilityId
		: (componentId
			? segments[0]
			: (segments.length > 1
				? (segments.length === 2 ? segments[0] : segments[1])
				: '')
		)

	let command = ''
	if (componentId) {
		if (capabilityId) {
			command = segments[0]
		} else {
			if (segments.length === 2) {
				command = segments[1]
			}
		}
	} else {
		if (segments.length === 3) {
			command = segments[2]
		} if (segments.length === 2) {
			command = segments[1]
		}
	}

	return {
		component: component,
		capability: capability,
		command: command,
		arguments: args,
	}
}

const inputRegex = new RegExp(/^([a-zA-Z0-9]+:)?([a-zA-Z0-9]+:)?([a-zA-Z0-9]+(\(.*\))?)?$/)

export const getComponentFromUser = async (
		command: SmartThingsCommand,
		device: Device,
		cmd: Command,
): Promise<Command> => {
	if (device.components && device.components.length > 1) {
		console.log('\nComponents:')
		let index = 1
		const table = command.tableGenerator.newOutputTable()
		for (const comp of device.components) {
			table.push([index, comp.id])
			index++
		}
		console.log(table.toString())

		const input = await stringInput('Enter component index or id', {
			validate: (input: string) => inputRegex.test(input) || 'Invalid command syntax',
		})

		if (isIndexArgument(input)) {
			cmd.component = device.components[Number.parseInt(input) - 1].id || ''
		} else {
			cmd = parseDeviceCommand(input)
		}

		if (cmd.component === '') {
			return cancelCommand()
		}
	}
	return cmd
}

export const getCapabilityFromUser = async (
		command: SmartThingsCommand,
		component: Component,
		cmd: Command,
): Promise<Command> => {
	if (component.capabilities.length > 1) {
		console.log('\nCapabilities:')
		let index = 1
		const table = command.tableGenerator.newOutputTable()
		for (const cap of component.capabilities) {
			table.push([index, cap.id])
			index++
		}
		console.log(table.toString())

		const input = await stringInput('Enter capability index or id', {
			validate: (input: string) => inputRegex.test(input) || 'Invalid command syntax',
		})

		if (isIndexArgument(input)) {
			cmd.capability = component.capabilities[Number.parseInt(input) - 1].id || ''
		} else {
			cmd = parseDeviceCommand(input, cmd.component)
		}

		if (cmd.capability === '') {
			return cancelCommand()
		}
	} else {
		cmd.capability = component.capabilities[0].id
	}
	return cmd
}

export const getCommandFromUser = async (
		apiCommand: APICommand,
		cap: CapabilityReference,
		cmd: Command,
): Promise<Command> => {
	const capability = await apiCommand.client.capabilities.get(cap.id, cap.version || 1)
	if (capability.commands && Object.keys(capability.commands).length > 0) {
		console.log('\nCommands:')
		let index = 1
		const commandNames = Object.keys(capability.commands)
		const table = apiCommand.tableGenerator.newOutputTable()
		for (const commandName of commandNames) {
			const command = capability.commands[commandName]
			const args = command?.arguments?.map(it =>
				it.optional
					? `[${it.name}<${attributeTypeDisplayString(it.schema)}>]`
					: `${it.name}<${attributeTypeDisplayString(it.schema)}>`,
			).join(', ') || ''
			table.push([index, `${commandName}(${args})`])
			index++
		}
		console.log(table.toString())

		const input = await stringInput('Enter command', {
			validate: (input: string) => inputRegex.test(input) || 'Invalid command syntax',
		})

		if (isIndexArgument(input)) {
			cmd.command = commandNames[Number.parseInt(input) - 1]
		} else {
			cmd = parseDeviceCommand(input, cmd.component, cmd.capability)
		}

		if (cmd.command === '') {
			return cancelCommand()
		}

		const command = capability.commands[cmd.command]
		if (command.arguments && command.arguments?.length > 0 && (!cmd.arguments || cmd.arguments.length === 0)) {
			const args = command?.arguments?.map(it => it.optional ? `[${it.name}]` : it.name).join(', ') || ''
			const input = await optionalStringInput(`Enter command arguments (${args})`)

			if (!input) {
				return cancelCommand()
			}

			cmd.arguments = parseArguments(input)
		}
	} else {
		return cancelCommand('Capability has no commands')
	}
	return cmd
}

export const getInputFromUser = async (command: APICommand, deviceId: string): Promise<Command> => {
	const device = await command.client.devices.get(deviceId)
	console.log('\n' + device.label)

	let cmd = await getComponentFromUser(command, device, {
		component: 'main',
		capability: '',
		command: '',
	})

	if (!cmd.capability) {
		const component = device.components?.find(it => it.id === cmd.component)
		if (component) {
			cmd = await getCapabilityFromUser(command, component, cmd)
		} else {
			throw new Error(`Component '${cmd.component}' not found`)
		}

		if (!cmd.command) {
			const cap = component.capabilities.find(it => it.id === cmd.capability)
			if (cap) {
				cmd = await getCommandFromUser(command, cap, cmd)
			} else {
				throw new Error(`Capability '${cmd.capability}' of component '${cmd.component}' not found`)
			}
		}
	}
	return cmd
}
