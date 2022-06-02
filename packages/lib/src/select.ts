import { CliUx } from '@oclif/core'
import inquirer from 'inquirer'

import { IdRetrievalFunction, ListDataFunction, Naming, outputList, Sorting } from './basic-io'
import { setConfigKey } from './cli-config'
import { stringGetIdFromUser } from './command-util'
import { CommonListOutputProducer } from './format'
import { SmartThingsCommandInterface } from './smartthings-command'


export type SelectingConfig<L> = Sorting & Naming & CommonListOutputProducer<L>

export const indefiniteArticleFor = (name: string): string => name.match(/^[aeio]/i) ? 'an' : 'a'

function promptFromNaming(config: Naming): string | undefined {
	return config.itemName ? `Select ${indefiniteArticleFor(config.itemName)} ${config.itemName}.` : undefined
}

export interface PromptUserOptions<L, ID = string> {
	/**
	 * A function that returns the list of items to display.
	 */
	listItems: ListDataFunction<L>

	/**
	 * The method that will prompt the user for an item from the list.
	 *
	 * @default `stringGetIdFromUser` which is usually the right option unless `ID` is not `string`
	 */
	getIdFromUser?: IdRetrievalFunction<ID, L>

	/**
	 * A message to display to the user when prompting for their choice (this is passed to
	 * `getIdFromUser`).
	 *
	 * @default prompt is generated automatically using `itemName` from the corresponding config
	 * as "Select a(n) <itemName>". If no `itemName` is specified, `undefined` is passed to
	 * `getIdFromUser`. (The default `getIdFromUser`, `stringGetIdFromUser`, uses
	 * "Enter id or index" when not prompt is specified.)
	 */
	promptMessage?: string

	/**
	 * Set this to true if you want to automatically choose for the user if `listItems` returns
	 * exactly one item.
	 *
	 * @default: false
	 */
	autoChoose?: boolean
}

/**
 * Display a list of items and ask the user to choose one. You probably want to use
 * `selectFromList` instead which also allows for a preselected id (usually from the command line).
 *
 * @param command The command that is requesting the selection.
 * @param config Configuration for primary key, sorting key and fields to display when asking the user for a selection.
 * @param options More parameters bundled in an object for readability.
 * @returns Selected id if one was chosen. Logs message if no items are found and exits.
 */
export async function promptUser<L, ID = string>(command: SmartThingsCommandInterface,
		config: SelectingConfig<L>, options: PromptUserOptions<L, ID>): Promise<ID> {
	const items = await options.listItems()
	if (options.autoChoose && items.length === 1) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore Typescript can't check that run-time variable `config.primaryKeyName` exists.
		return items[0][config.primaryKeyName] as ID
	}
	const list = await outputList(command, config, async () => items, true, true)
	if (list.length === 0) {
		// Nothing was found; user was already notified by `outputList` above.
		command.exit(0)
	}

	const getIdFromUser = (options.getIdFromUser ?? stringGetIdFromUser) as IdRetrievalFunction<ID, L>
	return await getIdFromUser(config, list, options.promptMessage ?? promptFromNaming(config))
}

export interface SelectOptions<L, ID = string> extends PromptUserOptions<L, ID> {
	/**
	 * If the value passed here is truthy, it is simply returned and no further processing is done.
	 */
	preselectedId?: ID

	/**
	 * Specify this if you want to allow the user to save their answer as a default. (Including
	 * this will also use that default rather than prompting the user if one has been set.)
	 */
	configKeyForDefaultValue?: string
}

/**
 * Process selection of an item from a list. Uses `preselectedId` if it is defined and asks the
 * user to choose from items returned by `listItems` if not.
 *
 * @param command The command that is requesting the selection.
 * @param config Configuration for primary key, sorting key and fields to display when asking the user for a selection.
 * @param options More parameters bundled in an object for readability.
 * @returns Selected id if one was chosen. Logs message if no items are found and exits.
 */
export async function selectFromList<L, ID = string>(command: SmartThingsCommandInterface,
		config: SelectingConfig<L>, options: SelectOptions<L, ID>): Promise<ID> {
	if (options.preselectedId) {
		return options.preselectedId
	}

	if (options.configKeyForDefaultValue) {
		const configuredDefault = command.cliConfig.profile[options.configKeyForDefaultValue] as ID
		if (configuredDefault) {
			return configuredDefault
		}
	}

	const userSelected = await promptUser(command, config, options)

	const neverAgainKey = `${options.configKeyForDefaultValue}::neverAskForSaveAgain`
	if (options.configKeyForDefaultValue && !command.booleanConfigValue(neverAgainKey)) {
		const answer = (await inquirer.prompt({
			type: 'list',
			name: 'answer',
			message: 'Do you want to save this as the default?',
			choices: [
				{ name: 'Yes', value: 'yes' },
				{ name: 'No', value: 'no' },
				{ name: 'No, and do not ask again', value: 'never' },
			],
		})).answer as string

		const resetInfo = 'You can reset these settings using the config:reset command.'
		if (answer === 'yes') {
			await setConfigKey(command.cliConfig, options.configKeyForDefaultValue, userSelected)
			CliUx.ux.log(`${userSelected} is now the default.\n${resetInfo}`)
		} else if (answer === 'never') {
			await setConfigKey(command.cliConfig, neverAgainKey, true)
			CliUx.ux.log(`You will not be asked again.\n${resetInfo}`)
		}
	}

	return userSelected
}
