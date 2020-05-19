import inquirer from 'inquirer'

import { InputOutputAPICommand } from '@smartthings/cli-lib'
import {
	CapabilityCreate,
	CapabilityAttribute,
	CapabilityJSONSchema,
	CapabilityCommand,
	CapabilityArgument,
	Capability,
	CapabilitySchemaPropertyName,
} from '@smartthings/core-sdk'

import { buildTableOutput } from '../capabilities'


const enum Type {
	INTEGER = 'integer',
	NUMBER = 'number',
	STRING = 'string',
	BOOLEAN = 'boolean',
}

export default class CapabilitiesCreate extends InputOutputAPICommand<CapabilityCreate, Capability> {
	static description = 'create a capability for a user'

	static flags = InputOutputAPICommand.flags

	protected buildTableOutput(capability: Capability): string {
		return buildTableOutput(capability)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesCreate)
		await super.setup(args, argv, flags)

		this.processNormally(capability => {
			return this.client.capabilities.create(capability)
		})
	}

	private addCommand(capability: CapabilityCreate, name: string, command: CapabilityCommand): void {
		if (capability.commands === undefined) {
			capability.commands = {}
		}
		capability.commands[name] = command
	}

	private async promptAndAddSetter(capability: CapabilityCreate,
			attributeName: string, attribute: CapabilityAttribute,
			type: Type): Promise<void> {
		const addSetter = (await inquirer.prompt({
			type: 'confirm',
			name: 'addSetter',
			message: 'Add a setter command for this attribute?',
		})).addSetter

		this.logger.debug(`promptAndAddSetter - addSetter = ${addSetter}`)
		if (addSetter) {
			// add setter command name to attribute and create the command, if applicable
			const commandName = `set${attributeName.replace(/^\w/, c => c.toUpperCase())}`
			attribute.setter = commandName
			const argument: CapabilityArgument = {
				name: 'value',
				optional: false,
				schema: this.buildSchemaMatchingAttributeType(attribute, type),
			}
			const setterCommand = {
				name: commandName,
				arguments: [argument],
			}
			this.addCommand(capability, commandName, setterCommand)
		}
	}

	private addBasicCommand(capability: CapabilityCreate, attribute: CapabilityAttribute,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			commandName: string, type: Type, value: any): void {
		if (!attribute.enumCommands) {
			attribute.enumCommands = []
		}
		attribute.enumCommands.push({ command: commandName, value })

		const command = {
			name: commandName,
			arguments: [{
				name: 'value',
				optional: false,
				schema: this.buildSchemaMatchingAttributeType(attribute, type),
			}],
		}
		this.addCommand(capability, commandName, command)
	}

	private async promptAndAddBasicCommands(capability: CapabilityCreate,
			attribute: CapabilityAttribute, type: Type): Promise<void> {
		let basicCommandName = ''
		const baseMessage = 'If you want to add a basic command, enter a ' +
			'command name now (or hit enter for none):'
		let message = `${baseMessage}\n(Basic commands are simple commands ` +
			'that set the attribute to a specific value.)'
		do {
			basicCommandName = (await inquirer.prompt({
				type: 'input',
				name: 'basicCommandName',
				message,
			})).basicCommandName
			message = baseMessage

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let basicCommandValue: any = undefined
			const minimum = attribute.schema.properties.value.minimum
			const maximum = attribute.schema.properties.value.maximum
			const maxLength = attribute.schema.properties.value.maxLength
			if (basicCommandName) {
				// TODO: This switch (/if/else/else) should be handled in a
				// more generic/object oriented way
				if (type === Type.INTEGER || type === Type.NUMBER) {
					basicCommandValue = parseInt((await inquirer.prompt({
						type: 'input',
						name: 'basicCommandValue',
						message: 'Command Value: ',
						validate: (input) => {
							if (isNaN(input)) {
								return 'Please enter a numeric value'
							}
							if (typeof minimum === 'number' && parseInt(input) < minimum) {
								return 'Number must be greater than or equal to minimum.'
							}
							if (typeof maximum === 'number' && parseInt(input) > maximum) {
								return 'Number must be less than or equal to maximum value.'
							}
							return true
						},
					})).basicCommandValue)
				} else if (type === Type.STRING) {
					basicCommandValue = (await inquirer.prompt({
						type: 'input',
						name: 'basicCommandValue',
						message: 'Command Value: ',
						validate: (input) => {
							if (typeof maxLength === 'number' && input.length > maxLength) {
								return 'String cannot be greater than maximum length.'
							}
							return true
						},
					})).basicCommandValue
				} else if (type === Type.BOOLEAN) {
					basicCommandValue = (await inquirer.prompt({
						type: 'list',
						name: 'basicCommandValue',
						message: 'Command Value: ',
						// choices must be strings as per inquirer documentation
						choices: ['True', 'False'],
					})).basicCommandValue
				} else {
					this.logger.error('invalid state in promptAndAddBasicCommands')
				}

				this.addBasicCommand(capability, attribute, basicCommandName,
					type, basicCommandValue)
			}
		} while (basicCommandName)
	}

	private async promptForType(message: string): Promise<Type> {
		return (await inquirer.prompt({
			type: 'list',
			name: 'type',
			message: `Select an ${message} type:`,
			choices: [Type.INTEGER, Type.NUMBER, Type.STRING, Type.BOOLEAN],
		})).type
	}

	private async promptAndAddAttribute(capability: CapabilityCreate): Promise<void> {
		const name: string = (await inquirer.prompt({
			type: 'input',
			name: 'attributeName',
			message: 'Attribute Name: ',
			validate: (input) => {
				return input.length > 0 || 'Invalid attribute name'
			},
		})).attributeName

		const type = await this.promptForType('attribute')

		const attribute: CapabilityAttribute = {
			schema: {
				type: 'object',
				properties: {
					value: {
						type,
					},
				},
				additionalProperties: false,
				required: [CapabilitySchemaPropertyName.VALUE],
			},
		}

		if (type === Type.INTEGER || type === Type.NUMBER) {
			const minValue: string | undefined = (await inquirer.prompt({
				type: 'input',
				name: 'minValue',
				message: 'Minimum value (default: no minimum): ',
				validate: (input) => {
					return input.length === 0 || !isNaN(input) || 'Please enter a numeric value'
				},
			})).minValue
			if (minValue) {
				attribute.schema.properties.value.minimum = parseInt(minValue)
			}
			const maxValue: string | undefined = (await inquirer.prompt({
				type: 'input',
				name: 'maxValue',
				message: 'Maximum value (default: no maximum): ',
				validate: (input) => {
					if (input.length === 0) {
						return true
					}
					if (isNaN(input)) {
						return 'Please enter a numeric value'
					}
					return minValue === undefined
						|| parseInt(input) > parseInt(minValue)
						|| 'Maximum value must be greater than minimum value.'
				},
			})).maxValue
			if (maxValue) {
				attribute.schema.properties.value.maximum = parseInt(maxValue)
			}
		} else if (type === Type.STRING) {
			// TODO: min length also ???
			const maxLength: string | undefined = (await inquirer.prompt({
				type: 'input',
				name: 'maxLength',
				message: 'Maximum length (default: no max length): ',
				validate: (input) => {
					return input.length === 0 || !isNaN(input) || 'Please enter a numeric value'
				},
			})).maxLength
			if (maxLength) {
				attribute.schema.properties.value.maxLength = parseInt(maxLength)
			}
		}

		await this.promptAndAddSetter(capability, name, attribute, type)
		await this.promptAndAddBasicCommands(capability, attribute, type)

		if (capability.attributes === undefined) {
			capability.attributes = {}
		}
		capability.attributes[name] = attribute
	}

	private buildSchemaMatchingAttributeType(attribute: CapabilityAttribute, type: Type): CapabilityJSONSchema {
		const retVal: CapabilityJSONSchema = {
			type,
		}
		if (attribute.schema.properties.value.minimum !== undefined) {
			retVal.minimum = attribute.schema.properties.value.minimum
		}
		if (attribute.schema.properties.value.maximum !== undefined) {
			retVal.maximum = attribute.schema.properties.value.maximum
		}
		if (attribute.schema.properties.value.maxLength !== undefined) {
			retVal.maxLength = attribute.schema.properties.value.maxLength
		}
		return retVal
	}

	private async promptAndAddCommand(capability: CapabilityCreate): Promise<void> {
		const name: string = (await inquirer.prompt({
			type: 'input',
			name: 'commandName',
			message: 'Command Name: ',
			validate: (input) => {
				return input.length > 0 || 'Invalid command name'
			},
		})).commandName

		const command: CapabilityCommand = {
			name,
			arguments: [],
		}

		let argumentName = ''
		do {
			argumentName = (await inquirer.prompt({
				type: 'input',
				name: 'argumentName',
				message: 'If you want to add argument, enter a name for it now (enter to finish): ',
			})).argumentName

			if (argumentName) {
				const type = await this.promptForType('argument')

				const optional = (await inquirer.prompt({
					type: 'confirm',
					name: 'optionalArgument',
					message: 'Is this argument optional?',
				})).optionalArgument

				const argument: CapabilityArgument = {
					name: argumentName,
					optional,
					schema: {
						type,
					},
				}
				command.arguments?.push(argument)
			}
		} while (argumentName)

		if (command.arguments?.length === 0) {
			delete command.arguments
		}

		this.addCommand(capability, name, command)
	}

	// TODO: throughout this Q&A session there seldom options to cancel input
	// choices without starting completely over. We need to look at fixing this.
	// TODO: also, this process needs more up-front validation
	protected async getInputFromUser(): Promise<CapabilityCreate> {
		const name = (await inquirer.prompt({
			type: 'input',
			name: 'capabilityName',
			message: 'Capability Name:',
			validate: (input: string) => {
				return new RegExp('^[a-zA-Z0-9][a-zA-Z0-9 ]{1,35}$').test(input) || 'Invalid capability name'
			},
		})).capabilityName

		const capability: CapabilityCreate = {
			name,
		}

		const enum Action {
			ADD_ATTRIBUTE = 'Add an attribute',
			ADD_COMMAND = 'Add a command',
			FINISH = 'Finish & Create',
		}
		let action: string
		let choices = [Action.ADD_ATTRIBUTE, Action.ADD_COMMAND]
		do {
			action = (await inquirer.prompt({
				type: 'list',
				name: 'action',
				message: 'Select an action...',
				choices,
			})).action

			if (action === Action.ADD_ATTRIBUTE) {
				await this.promptAndAddAttribute(capability)
			} else if (action === Action.ADD_COMMAND) {
				await this.promptAndAddCommand(capability)
			}

			choices = [Action.ADD_ATTRIBUTE, Action.ADD_COMMAND, Action.FINISH]
		} while (action !== Action.FINISH)

		return capability
	}
}
