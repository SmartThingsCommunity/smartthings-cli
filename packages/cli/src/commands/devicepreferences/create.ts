import inquirer from 'inquirer'

import { DevicePreferenceCreate, PreferenceType } from '@smartthings/core-sdk'

import { APIOrganizationCommand, askForInteger, askForNumber, askForRequiredString, askForString, inputAndOutputItem, userInputProcessor } from '@smartthings/cli-lib'

import { tableFieldDefinitions } from '../devicepreferences'


export default class DevicePreferencesCreateCommand extends APIOrganizationCommand {
	static description = 'create a device preference'

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
	}

	static aliases = ['device-preferences:create']

	static examples = [
		'$ smartthings devicepreferences:create                              # create a new device profile by answering questions',
		'$ smartthings devicepreferences:create -d                           # generate a device profile by answering questions but do not actually create it',
		'$ smartthings devicepreferences:create -i dp.json                   # create a new device profile defined by the file dp.json',
		'$ smartthings devicepreferences:create -i dp.json -o dp-saved.json  # create a new device profile defined by the file dp.json and write the results to dp-saved.json',
	]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DevicePreferencesCreateCommand)
		await super.setup(args, argv, flags)

		await inputAndOutputItem(this, { tableFieldDefinitions },
			(_, input: DevicePreferenceCreate) => this.client.devicePreferences.create(input),
			userInputProcessor(this))
	}

	async getInputFromUser(): Promise<DevicePreferenceCreate> {
		const name = await askForString('Preference name:',
			input => !input || input.match(/^[a-z][a-zA-Z0-9]{2,23}$/) ? true : 'must be camelCase starting with a lowercase letter and 3-24 characters')
		const title = await askForRequiredString('Preference title:')
		const description = await askForString('Preference description:')

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
			const minimum = await askForInteger('Optional minimum value.')
			const maximum = await askForInteger('Optional maximum value.', minimum)
			const defaultValue = await askForInteger('Optional default value.', minimum, maximum)
			return {
				...base, preferenceType, definition: {
					minimum: minimum ?? undefined,
					maximum: maximum ?? undefined,
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
			const minLength = await askForInteger('Optional minimum length.')
			const maxLength = await askForInteger('Optional maximum length.', minLength)
			const stringType = (await inquirer.prompt({
				type: 'list',
				name: 'stringType',
				message: 'Choose a type of string.',
				choices: ['text', 'password', 'paragraph'],
				default: 'text',
			})).stringType as 'text' | 'password' | 'paragraph'
			const defaultValue = await askForString('Optional default value.',
				input => {
					if (minLength !== undefined && input.length < minLength) {
						return `default must be no less than minLength (${minLength}) characters`
					}
					if (maxLength !== undefined && input.length > maxLength) {
						return `default must be no more than maxLength (${maxLength}) characters`
					}
					return true
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
			const firstName = await askForRequiredString('Enter a name for the first option.')
			let value = await askForRequiredString('Enter a value for the first option.')

			const options: { [name: string]: string } = { [firstName]: value }

			let name: string | undefined
			do {
				name = await askForString('Enter a name for the next option or press enter to continue.')
				if (name) {
					value = await askForRequiredString('Enter a value for the option.')
					options[name] = value
				}
			} while (name)

			const defaultValue = (await inquirer.prompt({
				type: 'list',
				name: 'defaultValue',
				message: 'Choose a default value.',
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
