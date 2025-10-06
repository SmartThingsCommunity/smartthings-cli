import { select } from '@inquirer/prompts'
import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type DevicePreferenceCreate, type PreferenceType } from '@smartthings/core-sdk'

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
import { tableFieldDefinitions } from '../../lib/command/util/devicepreferences-util.js'
import {
	booleanInput,
	optionalIntegerInput,
	optionalNumberInput,
	optionalStringInput,
	stringInput,
	type ValidateFunction,
} from '../../lib/user-query.js'
import { numberValidateFn } from '../../lib/validate-util.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags

const command = 'devicepreferences:create'

const describe = 'create a device preference'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.example([
			[
				'$0 devicepreferences:create',
				'create a new device preference by answering questions',
			],
			[
				'$0 devicepreferences:create -d',
				'generate a device preference by answering questions but do not actually create it',
			],
			[
				'$0 devicepreferences:create -i dp.json',
				'create a new device preference defined by the file dp.json',
			],
			[
				'$0 devicepreferences:create -i dp.json -o dp-saved.json',
				'create a new device preference defined by the file dp.json and write the results to dp-saved.json',
			],
		])
		.epilog(apiDocsURL('createPreference'))

const getInputFromUser = async (): Promise<DevicePreferenceCreate> => {
	const validateName: ValidateFunction<string> = input => !input || input.match(/^[a-z][a-zA-Z0-9]{2,23}$/)
		? true
		: 'must be camelCase starting with a lowercase letter and 3-24 characters'
	const name = await optionalStringInput('Preference name:', { validate: validateName })
	const title = await stringInput('Preference title:')
	const description = await optionalStringInput('Preference description:')

	const required = await booleanInput('Is the preference required?', { default: false })

	const preferenceTypeChoices: PreferenceType[] = ['integer', 'number', 'boolean', 'string', 'enumeration']
	const preferenceType = await select({
		message: 'Choose a type for your preference.',
		choices: preferenceTypeChoices,
	}) as PreferenceType

	const base = {
		name, title, description, required,
	}

	if (preferenceType === 'integer') {
		const min = await optionalIntegerInput('Optional minimum value.')
		const max = await optionalIntegerInput('Optional maximum value.', { validate: numberValidateFn({ min }) })
		const defaultValue = await optionalIntegerInput(
			'Optional default value.',
			{ validate: numberValidateFn({ min, max }) },
		)
		return {
			...base, preferenceType, definition: {
				minimum: min ?? undefined,
				maximum: max ?? undefined,
				default: defaultValue ?? undefined,
			},
		}
	}

	if (preferenceType === 'number') {
		const min = await optionalNumberInput('Optional minimum value.')
		const max = await optionalNumberInput('Optional maximum value.', { validate: numberValidateFn({ min }) })
		const defaultValue = await optionalNumberInput(
			'Optional default value.',
			{ validate: numberValidateFn({ min, max }) },
		)
		return {
			...base, preferenceType, definition: {
				minimum: min,
				maximum: max,
				default: defaultValue,
			},
		}
	}

	if (preferenceType === 'boolean') {
		const defaultValue = await select({
			message: 'Choose a default value.',
			choices: [{ name: 'none', value: undefined },
				{ name: 'true', value: true },
				{ name: 'false', value: false }],
		})
		return {
			...base, preferenceType, definition: {
				default: defaultValue ?? undefined,
			},
		}
	}

	if (preferenceType === 'string') {
		const minLength = await optionalIntegerInput('Optional minimum length.', { validate: numberValidateFn({ min: 0 }) })
		const maxLength = await optionalIntegerInput(
			'Optional maximum length.',
			{ validate: numberValidateFn({ min: minLength || 1 }) },
		)
		const stringType = await select({
			message: 'Choose a type of string.',
			choices: ['text', 'password', 'paragraph'],
			default: 'text',
		}) as 'text' | 'password' | 'paragraph'
		const defaultValue = await optionalStringInput('Optional default value.', {
			validate: input => {
				if (minLength !== undefined && input.length < minLength) {
					return `default must be no less than minLength (${minLength}) characters`
				}
				if (maxLength !== undefined && input.length > maxLength) {
					return `default must be no more than maxLength (${maxLength}) characters`
				}
				return true
			},
		})
		return {
			...base, preferenceType, definition: {
				minLength: minLength ?? undefined,
				maxLength: maxLength ?? undefined,
				stringType,
				default: defaultValue ?? undefined,
			},
		}
	}

	if (preferenceType === 'enumeration') {
		const firstName = await stringInput('Enter a name (key) for the first option.')
		let value = await stringInput('Enter a value for the first option.')

		const options: { [name: string]: string } = { [firstName]: value }

		let name: string | undefined
		do {
			name = await optionalStringInput('Enter a name (key) for the next option or press enter to continue.')
			if (name) {
				value = await stringInput('Enter a value for the option.')
				options[name] = value
			}
		} while (name)

		const defaultValue = await select({
			message: 'Choose a default option.',
			choices: [
				{ name: 'none', value: undefined },
				...Object.entries(options).map(([name, value]) => ({ name: `${value} (${name})`, value: name }))],
			default: undefined,
		})

		return {
			...base, preferenceType, definition: {
				options,
				default: defaultValue,
			},
		}
	}

	throw Error(`invalid preference type ${preferenceType}`)
}

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	await inputAndOutputItem(command, { tableFieldDefinitions },
		(_, input: DevicePreferenceCreate) => command.client.devicePreferences.create(input),
		userInputProcessor(getInputFromUser))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
