import inquirer from 'inquirer'

import { DevicePreferenceCreate, PreferenceType } from '@smartthings/core-sdk'
import {
	APIOrganizationCommand,
	askForNumber,
	askForString,
	askForOptionalString,
	inputAndOutputItem,
	userInputProcessor,
	ValidateFunction,
	askForOptionalInteger,
	integerValidateFn,
} from '@smartthings/cli-lib'
import { tableFieldDefinitions } from '../../lib/commands/devicepreferences-util'


export default class DevicePreferencesCreateCommand extends APIOrganizationCommand<typeof DevicePreferencesCreateCommand.flags> {
	static description = 'create a device preference' +
		this.apiDocsURL('createPreference')

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
	}

	static examples = [
		{
			description: 'create a new device preference by answering questions',
			command: 'smartthings devicepreferences:create',
		},
		{
			description: 'generate a device preference by answering questions but do not actually create it',
			command: 'smartthings devicepreferences:create -d',
		},
		{
			description: 'create a new device preference defined by the file dp.json',
			command: 'smartthings devicepreferences:create -i dp.json',
		},
		{
			description: 'create a new device preference defined by the file dp.json and write the results to dp - saved.json',
			command: 'smartthings devicepreferences:create - i dp.json - o dp - saved.json',
		},
	]

	async run(): Promise<void> {
		await inputAndOutputItem(this, { tableFieldDefinitions },
			(_, input: DevicePreferenceCreate) => this.client.devicePreferences.create(input),
			userInputProcessor(this))
	}

	async getInputFromUser(): Promise<DevicePreferenceCreate> {
		const validateName: ValidateFunction = input => !input || input.match(/^[a-z][a-zA-Z0-9]{2,23}$/)
			? true
			: 'must be camelCase starting with a lowercase letter and 3-24 characters'
		const name = await askForOptionalString('Preference name:', { validate: validateName })
		const title = await askForString('Preference title:')
		const description = await askForOptionalString('Preference description:')

		const required = (await inquirer.prompt({
			type: 'confirm',
			name: 'value',
			message: 'Is the preference required?',
			default: false,
		})).value as boolean

		const preferenceType = (await inquirer.prompt({
			type: 'list',
			name: 'preferenceType',
			message: 'Choose a type for your preference.',
			choices: ['integer', 'number', 'boolean', 'string', 'enumeration'],
		})).preferenceType as PreferenceType

		const base = {
			name, title, description, required,
		}

		if (preferenceType === 'integer') {
			const min = await askForOptionalInteger('Optional minimum value.')
			const max = await askForOptionalInteger('Optional maximum value.',
				{ validate: integerValidateFn({ min }) })
			const defaultValue = await askForOptionalInteger('Optional default value.',
				{ validate: integerValidateFn({ min, max }) })
			return {
				...base, preferenceType, definition: {
					minimum: min ?? undefined,
					maximum: max ?? undefined,
					default: defaultValue ?? undefined,
				},
			}
		}

		if (preferenceType === 'number') {
			const minimum = await askForNumber('Optional minimum value.')
			const maximum = await askForNumber('Optional maximum value.', minimum)
			const defaultValue = await askForNumber('Optional default value.', minimum, maximum)
			return {
				...base, preferenceType, definition: {
					minimum: minimum ?? undefined,
					maximum: maximum ?? undefined,
					default: defaultValue ?? undefined,
				},
			}
		}

		if (preferenceType === 'boolean') {
			const defaultValue = (await inquirer.prompt({
				type: 'list',
				name: 'defaultValue',
				message: 'Choose a default value.',
				choices: [{ name: 'none', value: undefined },
					{ name: 'true', value: true },
					{ name: 'false', value: false }],
			})).defaultValue as boolean | undefined
			return {
				...base, preferenceType, definition: {
					default: defaultValue ?? undefined,
				},
			}
		}

		if (preferenceType === 'string') {
			const minLength = await askForOptionalInteger('Optional minimum length.')
			const maxLength = await askForOptionalInteger('Optional maximum length.',
				{ validate: integerValidateFn({ min: minLength }) })
			const stringType = (await inquirer.prompt({
				type: 'list',
				name: 'stringType',
				message: 'Choose a type of string.',
				choices: ['text', 'password', 'paragraph'],
				default: 'text',
			})).stringType as 'text' | 'password' | 'paragraph'
			const defaultValue = await askForOptionalString('Optional default value.', {
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
			const firstName = await askForString('Enter a name (key) for the first option.')
			let value = await askForString('Enter a value for the first option.')

			const options: { [name: string]: string } = { [firstName]: value }

			let name: string | undefined
			do {
				name = await askForOptionalString('Enter a name (key) for the next option or press enter to continue.')
				if (name) {
					value = await askForString('Enter a value for the option.')
					options[name] = value
				}
			} while (name)

			const defaultValue = (await inquirer.prompt({
				type: 'list',
				name: 'defaultValue',
				message: 'Choose a default option.',
				choices: [
					{ name: 'none', value: undefined },
					...Object.entries(options).map(([name, value]) => ({ name: `${value} (${name})`, value: name }))],
				default: undefined,
			})).defaultValue as 'text' | 'password' | 'paragraph'

			return {
				...base, preferenceType, definition: {
					options,
					default: defaultValue,
				},
			}
		}

		throw Error(`invalid preference type ${preferenceType}`)
	}
}
