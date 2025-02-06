import inquirer from 'inquirer'
import log4js from 'log4js'
import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import {
	type CapabilityCreate,
	type CapabilityAttribute,
	type CapabilityJSONSchema,
	type CapabilityCommand,
	type CapabilityArgument,
	type Capability,
	CapabilitySchemaPropertyName,
	type HttpClientParams,
} from '@smartthings/core-sdk'

import { fatalError } from '../../lib/util.js'
import { apiCommandBuilder, apiDocsURL } from '../../lib/command/api-command.js'
import { apiOrganizationCommand, type APIOrganizationCommandFlags } from '../../lib/command/api-organization-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../lib/command/input-and-output-item.js'
import { userInputProcessor } from '../../lib/command/input-processor.js'
import { buildTableOutput } from '../../lib/command/util/capabilities-table.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags
	& {
		namespace?: string
	}

const command = 'capabilities:create'

const describe = 'create a capability'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.option('namespace', {
			alias: 'n',
			description: 'the namespace to create the capability under',
			type: 'string',
		})
		.example([
			['$0 capabilities:create', 'create a capability from prompted input'],
			['$0 capabilities:create --dry-run', 'build JSON for a capability from prompted input'],
			['$0 capabilities:create -i my-capability.yaml', 'create a capability defined in "my-capability.yaml'],
		])
		.epilog(apiDocsURL('createCapability'))

const logger = log4js.getLogger('cli')

const enum Type {
	INTEGER = 'integer',
	NUMBER = 'number',
	STRING = 'string',
	BOOLEAN = 'boolean',
}

const attributeAndCommandNamePattern = /^[a-z][a-zA-Z]{0,35}$/
function commandOrAttributeNameValidator(input: string): boolean | string {
	return !!attributeAndCommandNamePattern.exec(input)
		|| 'Invalid attribute name; only letters are allowed and must start with a lowercase letter, max length 36'
}

function unitOfMeasureValidator(input: string): boolean | string {
	return input.length < 25 ? true : 'The unit should be less than 25 characters'
}

const addCommand = (capability: CapabilityCreate, name: string, command: CapabilityCommand): void => {
	if (capability.commands === undefined) {
		capability.commands = {}
	}
	capability.commands[name] = command
}

const buildSchemaMatchingAttributeType = (attribute: CapabilityAttribute, type: Type): CapabilityJSONSchema => {
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

const promptAndAddSetter = async (
		capability: CapabilityCreate,
		attributeName: string, attribute: CapabilityAttribute,
		type: Type,
): Promise<void> => {
	const addSetter = (await inquirer.prompt({
		type: 'confirm',
		name: 'addSetter',
		message: 'Add a setter command for this attribute?',
	})).addSetter

	logger.debug(`promptAndAddSetter - addSetter = ${addSetter}`)
	if (addSetter) {
		// add setter command name to attribute and create the command, if applicable
		const commandName = `set${attributeName.replace(/^\w/, c => c.toUpperCase())}`
		attribute.setter = commandName
		const argument: CapabilityArgument = {
			name: 'value',
			optional: false,
			schema: buildSchemaMatchingAttributeType(attribute, type),
		}
		const setterCommand = {
			name: commandName,
			arguments: [argument],
		}
		addCommand(capability, commandName, setterCommand)
	}
}

const addBasicCommand = (
		capability: CapabilityCreate,
		attribute: CapabilityAttribute,
		commandName: string,
		type: Type,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		value: any,
): void => {
	if (!attribute.enumCommands) {
		attribute.enumCommands = []
	}
	attribute.enumCommands.push({ command: commandName, value })

	const capabilityCommand = {
		name: commandName,
		arguments: [{
			name: 'value',
			optional: false,
			schema: buildSchemaMatchingAttributeType(attribute, type),
		}],
	}
	addCommand(capability, commandName, capabilityCommand)
}

const promptAndAddBasicCommands = async (
		capability: CapabilityCreate,
		attribute: CapabilityAttribute,
		type: Type,
): Promise<void> => {
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
			validate: (input) => {
				// empty string is allowed here because it ends basic command name input
				return !input || commandOrAttributeNameValidator(input)
			},
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
				logger.error('invalid state in promptAndAddBasicCommands')
			}

			addBasicCommand(capability, attribute, basicCommandName, type, basicCommandValue)
		}
	} while (basicCommandName)
}

const promptForType = async (message: string): Promise<Type> => {
	return (await inquirer.prompt({
		type: 'list',
		name: 'type',
		message: `Select an ${message} type:`,
		choices: [Type.INTEGER, Type.NUMBER, Type.STRING, Type.BOOLEAN],
	})).type
}

const promptForAttributeName = async (): Promise<string> => {
	return (await inquirer.prompt({
		type: 'input',
		name: 'attributeName',
		message: 'Attribute Name: ',
		validate: commandOrAttributeNameValidator,
	})).attributeName
}

const promptForUnitOfMeasure = async (): Promise<string> => {
	return (await inquirer.prompt({
		type: 'input',
		name: 'unitOfMeasure',
		message: 'Unit of measure (default: none): ',
		validate: unitOfMeasureValidator,
	})).unitOfMeasure
}

const promptAndAddAttribute = async (capability: CapabilityCreate): Promise<void> => {
	let name = await promptForAttributeName()

	let userAcknowledgesNoSetter = false
	while (name.length > 33 && !userAcknowledgesNoSetter) {
		const answer = (await inquirer.prompt({
			type: 'list',
			name: 'answer',
			message: `Attribute Name ${name} is too long to make a setter.`,
			choices: [
				{ name: 'Enter a shorter name (max 33 characters)', value: 'shorter ' },
				{ name: 'I won\'t need a setter', value: 'noSetter' },
			],
		})).answer
		if (answer === 'noSetter') {
			userAcknowledgesNoSetter = true
		} else {
			name = await promptForAttributeName()
		}
	}

	const type = await promptForType('attribute')

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

		const unit = await promptForUnitOfMeasure()
		if (unit) {
			// Note: we don't support multiple units here because we want to move toward using a single unit
			// of measure in capabilities
			attribute.schema.properties.unit = {
				type: 'string',
				enum: [unit],
				default: unit,
			}
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

	if (!userAcknowledgesNoSetter) {
		await promptAndAddSetter(capability, name, attribute, type)
	}
	await promptAndAddBasicCommands(capability, attribute, type)

	if (capability.attributes === undefined) {
		capability.attributes = {}
	}
	capability.attributes[name] = attribute
}

const promptAndAddCommand = async (capability: CapabilityCreate): Promise<void> => {
	const name: string = (await inquirer.prompt({
		type: 'input',
		name: 'commandName',
		message: 'Command Name: ',
		validate: commandOrAttributeNameValidator,
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
			const type = await promptForType('argument')

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

	addCommand(capability, name, command)
}

// TODO: throughout this Q&A session there seldom options to cancel input
// choices without starting completely over. We need to look at fixing this.
// TODO: also, this process needs more up-front validation
const getInputFromUser = async (): Promise<CapabilityCreate> => {
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
			await promptAndAddAttribute(capability)
		} else if (action === Action.ADD_COMMAND) {
			await promptAndAddCommand(capability)
		}

		choices = [Action.ADD_ATTRIBUTE, Action.ADD_COMMAND, Action.FINISH]
	} while (action !== Action.FINISH)

	return capability
}

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const params: HttpClientParams = {}
	if (argv.namespace) {
		params.namespace = argv.namespace
	}

	const createCapability = async (_: void, capability: CapabilityCreate): Promise<Capability> => {
		return command.client.capabilities.create(capability, params)
			.catch(error => {
				if (error.response?.status == 403 && argv.namespace) {
					return fatalError('Unable to create capability under specified namespace. ' +
						'Either the namespace does not exist or you do not have permission.')
				}

				throw error
			})
	}

	await inputAndOutputItem(command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		createCapability, userInputProcessor(getInputFromUser))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
