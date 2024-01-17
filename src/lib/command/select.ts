import inquirer from 'inquirer'

import {
	IdRetrievalFunction,
	ListDataFunction,
	LookupDataFunction,
	Naming,
	outputList,
	OutputListConfig,
	Sorting,
} from './basic-io.js'
import { resetManagedConfigKey, setConfigKey } from '../cli-config.js'
import { stringGetIdFromUser } from './command-util.js'
import { SmartThingsCommand } from './smartthings-command.js'
import { buildOutputFormatterBuilder, BuildOutputFormatterFlags } from './output-builder.js'


export type SelectFromListConfig<L extends object> = Sorting<L> & Naming & OutputListConfig<L>

export const indefiniteArticleFor = (name: string): string => name.match(/^[aeio]/i) ? 'an' : 'a'

function promptFromNaming(config: Naming): string | undefined {
	return config.itemName ? `Select ${indefiniteArticleFor(config.itemName)} ${config.itemName}.` : undefined
}

export type PromptUserFlags = BuildOutputFormatterFlags
export const promptUserBuilder = buildOutputFormatterBuilder
export type PromptUserOptions<L extends object, ID = string> = {
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
export async function promptUser<L extends object, ID = string>(command: SmartThingsCommand<PromptUserFlags>,
		config: SelectFromListConfig<L>, options: PromptUserOptions<L, ID>): Promise<ID> {
	const items = await options.listItems()
	if (options.autoChoose && items.length === 1) {
		return items[0][config.primaryKeyName] as unknown as ID
	}
	const list = await outputList(command, config, async () => items, true, true)
	if (list.length === 0) {
		// Nothing was found; user was already notified by `outputList` above.
		// eslint-disable-next-line no-process-exit
		process.exit(0)
	}

	const getIdFromUser = (options.getIdFromUser ?? stringGetIdFromUser) as IdRetrievalFunction<ID, L>
	return await getIdFromUser(config, list, options.promptMessage ?? promptFromNaming(config))
}

export type SelectFromListFlags = PromptUserFlags
export const selectFromListBuilder = promptUserBuilder

export type SelectOptions<L extends object, ID = string> = PromptUserOptions<L, ID> & {
	/**
	 * If the value passed here is truthy, it is returned and no further processing is done.
	 */
	preselectedId?: ID

	/**
	 * Specify this if you want to allow the user to save their answer as a default. (Including
	 * this will also use that default rather than prompting the user if one has been set.)
	 */
	defaultValue?: {
		/**
		 * The key name in the config file to use.
		 */
		configKey: string

		/**
		 * This method will be called to verify the saved id is still valid and inform the user it
		 * is being used if so.
		 *
		 * The item is considered invalid if this method returns undefined or throws axios exception
		 * with a status code of 403 or 404.
		 */
		getItem: LookupDataFunction<ID, L>

		/**
		 * This function should return a message to display to the user when the default value is
		 * found and used.
		 */
		userMessage: (item: L) => string
	}
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
export async function selectFromList<L extends object, ID = string>(command: SmartThingsCommand<SelectFromListFlags>,
		config: SelectFromListConfig<L>, options: SelectOptions<L, ID>): Promise<ID> {
	if (options.preselectedId) {
		return options.preselectedId
	}

	if (options.defaultValue) {
		const configuredDefault = command.cliConfig.profile[options.defaultValue.configKey] as ID
		if (configuredDefault) {
			try {
				const item = await options.defaultValue.getItem(configuredDefault)
				if (item) {
					console.log(options.defaultValue.userMessage(item))
					return configuredDefault
				}
			} catch (error) {
				if (!error.response || error.response.status !== 404 && error.response.status !== 403) {
					throw error
				}
			}

			await resetManagedConfigKey(command.cliConfig, options.defaultValue.configKey)
			command.logger.debug(`removed ${options.defaultValue.configKey} from ${command.cliConfig.profileName}`)
		}
	}

	const userSelected = await promptUser(command, config, options)

	const neverAgainKey = `${options.defaultValue?.configKey ?? ''}::neverAskForSaveAgain`
	if (options.defaultValue && !command.booleanConfigValue(neverAgainKey)) {
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
			await setConfigKey(command.cliConfig, options.defaultValue.configKey, userSelected)
			console.log(`${userSelected} is now the default.\n${resetInfo}`)
		} else if (answer === 'never') {
			await setConfigKey(command.cliConfig, neverAgainKey, true)
			console.log(`You will not be asked again.\n${resetInfo}`)
		}
	}

	return userSelected
}
