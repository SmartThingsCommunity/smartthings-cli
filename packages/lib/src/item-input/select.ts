import inquirer, { ChoiceCollection, Separator } from 'inquirer'

import { CancelAction, cancelOption, helpAction, helpOption, InputDefinition, inquirerPageSize, maxItemValueLength } from './defs'
import { clipToMaximum, stringFromUnknown } from '../util'


export type SelectDefOptions<T> = {
	/**
	 * A summary of the chosen item to display to the user in a list.
	 *
	 * If the choices are simple strings or numbers, the default is to display the string or
	 * number. For complex choices, the default function uses the `name` field.
	 */
	summarizeForEdit?: (item: T, context?: unknown[]) => string

	default?: T

	helpText?: string
}

export type SelectDefChoice<T> =
	| string
	| number
	| { name: string; value: T }

/**
 * InputDefinition for choosing a single item from a list.
 *
 * @param choices List of choices to present the user.
 * @param options See definition of `SelectDefOptions` for more details.
 */
export function selectDef<T>(
		name: string,
		choices: SelectDefChoice<T>[],
		options?: SelectDefOptions<T>,
): InputDefinition<T> {
	const nameOfChoice = (choice: SelectDefChoice<T>): string =>
		typeof choice === 'object' ? choice.name : choice.toString()
	const valueOfChoice = (choice: SelectDefChoice<T>): T =>
		(typeof choice === 'number' || typeof choice === 'string' ? choice : choice.value) as T

	const namesByValue = new Map(choices.map(choice => [valueOfChoice(choice), nameOfChoice(choice)]))

	const editValue = async (defaultSelection: T | undefined): Promise<T | CancelAction> => {
		const inquirerChoices: ChoiceCollection = choices.map(choice => ({
			name: nameOfChoice(choice),
			value: valueOfChoice(choice),
		}))

		inquirerChoices.push(new Separator())
		if (options?.helpText) {
			inquirerChoices.push(helpOption)
		}
		inquirerChoices.push(cancelOption)

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const selection = (await inquirer.prompt({
				type: 'list',
				name: 'selection',
				message: `Select ${name}.`,
				choices: inquirerChoices,
				default: defaultSelection ?? 0,
				pageSize: inquirerPageSize,
			})).selection

			if (selection === helpAction) {
				console.log(`\n${options?.helpText}\n`)
			} else {
				return selection
			}
		}
	}

	const buildFromUserInput = (): Promise<T | CancelAction> => editValue(options?.default)

	const summarizeForEdit = options?.summarizeForEdit
		?? ((value: T) => clipToMaximum((namesByValue.get(value)) ?? stringFromUnknown(value), maxItemValueLength))

	const updateFromUserInput = (original: T): Promise<T | CancelAction> => editValue(original)

	return { name, buildFromUserInput, summarizeForEdit, updateFromUserInput }
}
