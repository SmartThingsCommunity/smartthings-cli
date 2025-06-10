import { select } from '@inquirer/prompts'
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

import { booleanInput, integerInput, numberInput, optionalIntegerInput, optionalNumberInput, optionalStringInput, stringInput } from '../../lib/user-query.js'
import { fatalError } from '../../lib/util.js'
import { apiDocsURL } from '../../lib/command/api-command.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../lib/command/input-and-output-item.js'
import { userInputProcessor } from '../../lib/command/input-processor.js'
import { buildTableOutput } from '../../lib/command/util/capabilities-table.js'
import { numberValidateFn, stringValidateFn } from '../../lib/validate-util.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags
	& {
		namespace?: string
	}

const command = 'capabilities:create'

const describe = 'create a capability'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
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

type Type = 'integer' | 'number' | 'string' | 'boolean'

const commandOrAttributeNameValidator = stringValidateFn({
	regex: /^[a-z][a-zA-Z]{0,35}$/,
	errorMessage: 'Only letters are allowed, must start with a lowercase letter, max length 36',
})

const addCommand = (capability: CapabilityCreate, name: string, command: CapabilityCommand): void => {
	if (capability.commands === undefined) {
		capability.commands = {}
	}
	capability.commands[name] = command
}

const buildSchemaMatchingAttributeType = (attribute: CapabilityAttribute, type: Type): CapabilityJSONSchema => {
	const retVal: CapabilityJSONSchema = { type }
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
	const addSetter =  await booleanInput('Add a setter command for this attribute?')

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
		value: unknown,
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
	let basicCommandName: string | undefined = undefined
	const baseMessage = 'If you want to add a basic command, enter a command name now (or hit enter for none):'
	let message = `${baseMessage}\n(Basic commands are simple commands that set the attribute to a specific value.)`
	do {
		basicCommandName = await optionalStringInput(message, { validate: commandOrAttributeNameValidator })
		message = baseMessage

		let basicCommandValue: unknown = undefined
		const minimum = attribute.schema.properties.value.minimum
		const maximum = attribute.schema.properties.value.maximum
		const maxLength = attribute.schema.properties.value.maxLength
		if (basicCommandName) {
			if (type === 'integer' || type === 'number') {
				basicCommandValue = await (type === 'integer' ? integerInput : numberInput)(
					'Command Value:',
					{ validate: numberValidateFn({ min: minimum, max: maximum }) },
				)
			} else if (type === 'string') {
				const validate = typeof maxLength === 'number' ? stringValidateFn({ maxLength }) : undefined
				basicCommandValue = await stringInput('Command Value:', { validate })
			} else if (type === 'boolean') {
				basicCommandValue = await booleanInput('Command Value:')
			} else {
				logger.error('invalid state in promptAndAddBasicCommands')
			}

			addBasicCommand(capability, attribute, basicCommandName, type, basicCommandValue)
		}
	} while (basicCommandName)
}

const promptForType = async (message: string): Promise<Type> => {
	const choices: Type[] = ['integer', 'number', 'string', 'boolean']
	return await select({ message: `Select an ${message} type:`, choices })
}

const promptAndAddAttribute = async (capability: CapabilityCreate): Promise<void> => {
	const promptForAttributeName = async (): Promise<string> =>
		await stringInput('Attribute Name:', { validate: commandOrAttributeNameValidator })

	let name = await promptForAttributeName()

	let userAcknowledgesNoSetter = false
	while (name.length > 33 && !userAcknowledgesNoSetter) {
		const answer = await select({
			message: `Attribute Name ${name} is too long to make a setter.`,
			choices: [
				{ name: 'Enter a shorter name (max 33 characters)', value: 'shorter ' },
				{ name: 'I won\'t need a setter', value: 'noSetter' },
			],
		})
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

	if (type === 'integer' || type === 'number') {
		const minValue = await (type === 'integer' ? optionalIntegerInput : optionalNumberInput)(
			'Minimum value (default: no minimum):',
		)
		if (minValue != null) {
			attribute.schema.properties.value.minimum = minValue
		}
		const maxValue = await (type === 'integer' ? optionalIntegerInput : optionalNumberInput)(
			'Minimum value (default: no maximum):',
			{ validate: numberValidateFn( { min: minValue } ) },
		)
		if (maxValue != null) {
			attribute.schema.properties.value.maximum = maxValue
		}

		const unit = await optionalStringInput(
			'Unit of measure (default: none):',
			{ validate: stringValidateFn({ maxLength: 25 }) },
		)
		if (unit) {
			// Note: we don't support multiple units here because we want to move toward using a single unit
			// of measure in capabilities
			attribute.schema.properties.unit = {
				type: 'string',
				enum: [unit],
				default: unit,
			}
		}
	} else if (type === 'string') {
		// TODO: min length also ???
		const maxLength = await optionalIntegerInput(
			'Maximum length (default: no max length):',
			{ validate: numberValidateFn({ min: 1 }) },
		)
		if (maxLength != null) {
			attribute.schema.properties.value.maxLength = maxLength
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
	const name: string = await stringInput('Command Name:', { validate: commandOrAttributeNameValidator })

	const command: CapabilityCommand = {
		name,
		arguments: [],
	}

	let argumentName: string | undefined = undefined
	do {
		argumentName =
			await optionalStringInput('If you want to add an argument, enter a name for it now (enter to finish): ')

		if (argumentName) {
			const type = await promptForType('argument')

			const optional = await booleanInput('Is this argument optional?')

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

const getInputFromUser = async (options: { dryRun: boolean }): Promise<CapabilityCreate> => {
	const name = await stringInput(
		'Capability Name:',
		{ validate: stringValidateFn({ regex: /^[a-zA-Z0-9][a-zA-Z0-9 ]{1,35}$/ }) },
	)

	const capability: CapabilityCreate = {
		name,
	}

	const startingChoices = [
		{ name: 'Add an attribute', value: 'add-attribute' },
		{ name: 'Add a command', value: 'add-command' },
	]
	const allChoices = [
		...startingChoices,
		{ name: `Finish & ${options.dryRun ? 'Output' : 'Create'}`, value: 'finish' },
	]
	let action: string
	let choices = startingChoices
	do {
		action = await select({ message: 'Select an action...', choices })

		if (action === 'add-attribute') {
			await promptAndAddAttribute(capability)
		} else if (action === 'add-command') {
			await promptAndAddCommand(capability)
		}

		choices = allChoices
	} while (action !== 'finish')

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
		createCapability, userInputProcessor(() => getInputFromUser({ dryRun: !!argv.dryRun })))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
