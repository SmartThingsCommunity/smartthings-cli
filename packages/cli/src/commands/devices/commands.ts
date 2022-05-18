import inquirer from 'inquirer'

import { Command, Component, CapabilityReference, Device } from '@smartthings/core-sdk'

import { APICommand, commandLineInputProcessor, inputItem, inputProcessor, isIndexArgument, selectFromList } from '@smartthings/cli-lib'

import { attributeType } from '../capabilities'


const inputRegex = new RegExp(/^([a-zA-Z0-9]+:)?([a-zA-Z0-9]+:)?([a-zA-Z0-9]+(\(.*\))?)?$/)

export function parseArguments(str: string): (Record<string, unknown> | string | number)[] {
	return JSON.parse(`[${str}]`)
}

export function parseDeviceCommand(str: string, componentId?: string, capabilityId?: string): Command {
	let cmdStr = str
	let args = []
	const pos = str.indexOf('(')
	if (pos > 0) {
		cmdStr = str.slice(0, pos)
		const argStr = str.slice(pos + 1, -1)
		args = JSON.parse(`[${argStr}]`)
	}

	const segs = cmdStr.split(':')

	const component = componentId ?
		componentId :
		(segs.length === 2 ? 'main' : segs[0])

	const capability = capabilityId ?
		capabilityId :
		(componentId ?
			segs[0] :
			(segs.length > 1 ?
				(segs.length === 2 ? segs[0] : segs[1]) :
				'')
		)

	let command = ''
	if (componentId) {
		if (capabilityId) {
			command = segs[0]
		} else {
			if (segs.length === 2) {
				command = segs[1]
			}
		}
	} else {
		if (segs.length === 3) {
			command = segs[2]
		} if (segs.length === 2) {
			command = segs[1]
		}
	}

	return {
		component: component,
		capability: capability,
		command: command,
		arguments: args,
	}
}

export default class DeviceCommandsCommand extends APICommand<typeof DeviceCommandsCommand.flags> {
	static description = 'execute a device command'

	static flags = {
		...APICommand.flags,
		...inputItem.flags,
	}

	static args = [
		{
			name: 'id',
			description: 'the device id',
		},
		{
			name: 'command',
			description: 'the command [<component>]:<capability>:<command>([<arguments>])',
		},
	]

	hasCommandLineInput(): boolean {
		return !!this.args.command
	}

	async getInputFromCommandLine(): Promise<Command[]> {
		return [parseDeviceCommand(this.args.command)]
	}

	protected async getComponentFromUser(device: Device, cmd: Command): Promise<Command> {
		if (device.components && device.components.length > 1) {
			this.log('\nComponents:')
			let index = 1
			const table = this.tableGenerator.newOutputTable()
			for (const comp of device.components) {
				table.push([index, comp.id])
				index++
			}
			this.log(table.toString())

			const input = (await inquirer.prompt({
				type: 'input',
				name: 'component',
				message: 'Enter component index or id',
				validate: (input: string) => {
					return inputRegex.test(input) || 'Invalid command syntax'
				},
			})).component

			if (isIndexArgument(input)) {
				cmd.component = device.components[Number.parseInt(input) - 1].id || ''
			} else {
				cmd = parseDeviceCommand(input)
			}

			if (cmd.component === '') {
				this.abort('Command aborted')
			}
		}
		return cmd
	}

	protected async getCapabilityFromUser(component: Component, cmd: Command): Promise<Command> {
		if (component.capabilities.length > 1) {
			this.log('\nCapabilities:')
			let index = 1
			const table = this.tableGenerator.newOutputTable()
			for (const cap of component.capabilities) {
				table.push([index, cap.id])
				index++
			}
			this.log(table.toString())

			const input = (await inquirer.prompt({
				type: 'input',
				name: 'capability',
				message: 'Enter capability index or id',
				validate: (input: string) => {
					return inputRegex.test(input) || 'Invalid command syntax'
				},
			})).capability

			if (isIndexArgument(input)) {
				cmd.capability = component.capabilities[Number.parseInt(input) - 1].id || ''
			} else {
				cmd = parseDeviceCommand(input, cmd.component)
			}

			if (cmd.capability === '') {
				this.abort('Command aborted')
			}
		} else {
			cmd.capability = component.capabilities[0].id
		}
		return cmd
	}

	protected async getCommandFromUser(cap: CapabilityReference, cmd: Command): Promise<Command> {
		const capability = await this.client.capabilities.get(cap.id, cap.version || 1)
		if (capability.commands && Object.keys(capability.commands).length > 0) {
			this.log('\nCommands:')
			let index = 1
			const commandNames = Object.keys(capability.commands)
			const table = this.tableGenerator.newOutputTable()
			for (const commandName of commandNames) {
				const command = capability.commands[commandName]
				const args = command?.arguments?.map(it =>
					it.optional ? `[${it.name}<${attributeType(it.schema)}>]` : `${it.name}<${attributeType(it.schema)}>`,
				).join(', ') || ''
				table.push([index, `${commandName}(${args})`])
				index++
			}
			this.log(table.toString())


			const input = (await inquirer.prompt({
				type: 'input',
				name: 'command',
				message: 'Enter command',
				validate: (input: string) => {
					return inputRegex.test(input) || 'Invalid command syntax'
				},
			})).command

			if (isIndexArgument(input)) {
				cmd.command = commandNames[Number.parseInt(input) - 1]
			} else {
				cmd = parseDeviceCommand(input, cmd.component, cmd.capability)
			}

			if (cmd.command === '') {
				this.abort('Command aborted')
			}

			const command = capability.commands[cmd.command]
			if (command.arguments && command.arguments?.length > 0 && (!cmd.arguments || cmd.arguments.length === 0)) {
				const args = command?.arguments?.map(it => it.optional ? `[${it.name}]` : it.name).join(', ') || ''
				const input = (await inquirer.prompt({
					type: 'input',
					name: 'arguments',
					message: `Enter command arguments (${args})`,
				})).arguments

				if (input === '') {
					this.abort('Command aborted')
				}

				cmd.arguments = parseArguments(input)
			}
		} else {
			this.abort('Capability has no commands')
		}
		return cmd
	}

	async getInputFromUser(deviceId: string): Promise<Command[]> {
		const device = await this.client.devices.get(deviceId)
		this.log('\n' + device.label)

		let cmd: Command = {
			component: 'main',
			capability: '',
			command: '',
		}

		cmd = await this.getComponentFromUser(device, cmd)

		if (!cmd.capability) {
			const component = device.components?.find(it => it.id === cmd.component)
			if (component) {
				cmd = await this.getCapabilityFromUser(component, cmd)
			} else {
				throw new Error(`Component '${cmd.component}' not found`)
			}

			if (!cmd.command) {
				const cap = component.capabilities.find(it => it.id === cmd.capability)
				if (cap) {
					cmd = await this.getCommandFromUser(cap, cmd)

				} else {
					throw new Error(`Capability '${cmd.capability}' of component '${cmd.component}' not found`)
				}
			}
		}
		return [cmd]
	}

	async run(): Promise<void> {
		const config = {
			primaryKeyName: 'deviceId',
			sortKeyName: 'label',
			listTableFieldDefinitions: ['label', 'name', 'type', 'deviceId'],
		}
		const deviceId = await selectFromList(this, config, {
			preselectedId: this.args.id,
			listItems: () => this.client.devices.list(),
		})
		const [commands] = await inputItem<Command[]>(this, commandLineInputProcessor(this),
			inputProcessor(() => true, () => this.getInputFromUser(deviceId)))
		await this.client.devices.executeCommands(deviceId, commands)
		this.log('Command executed successfully')
	}
}
