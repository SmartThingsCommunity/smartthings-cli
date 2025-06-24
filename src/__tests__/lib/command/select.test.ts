import { jest } from '@jest/globals'

import inquirer from 'inquirer'
import log4js from 'log4js'

import type {
	CLIConfig,
	Profile,
	ProfilesByName,
	resetManagedConfigKey,
	setConfigKey,
} from '../../../lib/cli-config.js'
import type {
	IdRetrievalFunction,
	ListDataFunction,
	LookupDataFunction,
} from '../../../lib/command/io-defs.js'
import type { stringGetIdFromUser } from '../../../lib/command/command-util.js'
import type { outputList } from '../../../lib/command/output-list.js'
import type { SelectFromListConfig, SelectOptions } from '../../../lib/command/select.js'
import type {
	SmartThingsCommand,
	SmartThingsCommandFlags,
} from '../../../lib/command/smartthings-command.js'
import type { SimpleType } from '../../test-lib/simple-type.js'


const promptMock = jest.fn<typeof inquirer.prompt>()
jest.unstable_mockModule('inquirer', () => ({
	default: {
		prompt: promptMock,
	},
}))

const resetManagedConfigKeyMock = jest.fn<typeof resetManagedConfigKey>()
const setConfigKeyMock = jest.fn<typeof setConfigKey>()
jest.unstable_mockModule('../../../lib/cli-config.js', () => ({
	resetManagedConfigKey: resetManagedConfigKeyMock,
	setConfigKey: setConfigKeyMock,
}))

const stringGetIdFromUserMock = jest.fn<typeof stringGetIdFromUser>()
jest.unstable_mockModule('../../../lib/command/command-util.js', () => ({
	stringGetIdFromUser: stringGetIdFromUserMock,
}))

const outputListMock = jest.fn<typeof outputList>()
jest.unstable_mockModule('../../../lib/command/output-list.js', () => ({
	outputList: outputListMock,
}))


const {
	indefiniteArticleFor,
	promptUser,
	selectFromList,
} = await import('../../../lib/command/select.js')


const item1: SimpleType = { str: 'string-id-1', num: 5 }
const item2: SimpleType = { str: 'string-id-2', num: 7 }
const list = [item1, item2]
const singleItemList = [item1]
const booleanConfigValueMock = jest.fn<CLIConfig['booleanConfigValue']>()

const commandWithProfile = (profile: Profile): SmartThingsCommand<SmartThingsCommandFlags> => ({
	logger: log4js.getLogger('cli'),
	cliConfig: {
		profileName: 'default',
		mergedProfiles: { default: { profile } } as ProfilesByName,
		profile,
		booleanConfigValue: booleanConfigValueMock,
	} as unknown as CLIConfig,
} as unknown as SmartThingsCommand<SmartThingsCommandFlags>)
const command = commandWithProfile({})
const config: SelectFromListConfig<SimpleType> = {
	primaryKeyName: 'str',
	sortKeyName: 'num',
}

const listItemsMock = jest.fn<ListDataFunction<SimpleType>>().mockResolvedValue(list)

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })

describe('indefiniteArticleFor', () => {
	it.each(['apple', 'Animal', 'egret', 'item', 'orange'])('returns "an" for "%s"', word => {
		expect(indefiniteArticleFor(word)).toBe('an')
	})

	it.each(['banana', 'Balloon', 'tree'])('returns "a" for "%s"', word => {
		expect(indefiniteArticleFor(word)).toBe('a')
	})
})

describe('promptUser', () => {
	it('works with defaults', async () => {
		outputListMock.mockResolvedValueOnce(list)
		stringGetIdFromUserMock.mockResolvedValue('chosen-id')

		expect(await promptUser(command, config, { listItems: listItemsMock })).toBe('chosen-id')

		expect(listItemsMock).toHaveBeenCalledExactlyOnceWith()
		expect(outputListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			config,
			expect.any(Function),
			{ includeIndex: true, forUserQuery: true },
		)
		expect(stringGetIdFromUserMock).toHaveBeenCalledExactlyOnceWith(config, list, undefined)

		// Anonymous function passed to outputList should return same list as listItems
		// without calling it again.
		const anonymousListFunction = outputListMock.mock.calls[0][2]
		expect(await anonymousListFunction()).toBe(list)
		expect(listItemsMock).toHaveBeenCalledTimes(1)
	})

	it('autoChoose default to false', async () => {
		listItemsMock.mockResolvedValueOnce(singleItemList)
		outputListMock.mockResolvedValueOnce(singleItemList)
		stringGetIdFromUserMock.mockResolvedValue('chosen-id')

		expect(await promptUser(command, config, { listItems: listItemsMock })).toBe('chosen-id')

		expect(listItemsMock).toHaveBeenCalledExactlyOnceWith()
		expect(outputListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			config,
			expect.any(Function),
			{ includeIndex: true, forUserQuery: true },
		)
		expect(stringGetIdFromUserMock)
			.toHaveBeenCalledExactlyOnceWith(config, singleItemList, undefined)
	})

	it('chooses single item automatically if autoChoose is on', async () => {
		listItemsMock.mockResolvedValueOnce(singleItemList)

		expect(await promptUser(command, config, { listItems: listItemsMock, autoChoose: true }))
			.toBe('string-id-1')

		expect(listItemsMock).toHaveBeenCalledTimes(1)
		expect(listItemsMock).toHaveBeenCalledWith()
		expect(outputListMock).not.toHaveBeenCalled()
		expect(stringGetIdFromUserMock).not.toHaveBeenCalled()
	})

	it('exits when nothing to select from', async () => {
		const exitSpy = jest.spyOn(process, 'exit')
		outputListMock.mockResolvedValue([])
		// fake exiting with a special thrown error
		exitSpy.mockImplementation(() => { throw Error('should exit') })

		await expect(promptUser(command, config, { listItems: listItemsMock }))
			.rejects.toThrow('should exit')

		expect(listItemsMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			config,
			expect.any(Function),
			{ includeIndex: true, forUserQuery: true },
		)
		expect(stringGetIdFromUserMock).not.toHaveBeenCalled()
	})
	it('calls custom getIdFromUser when specified', async () => {
		outputListMock.mockResolvedValueOnce(list)

		const getIdFromUser = jest.fn<IdRetrievalFunction<string, SimpleType>>()
			.mockResolvedValueOnce('special-id')

		expect(await promptUser(command, config, { listItems: listItemsMock, getIdFromUser }))
			.toBe('special-id')

		expect(listItemsMock).toHaveBeenCalledExactlyOnceWith()
		expect(outputListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			config,
			expect.any(Function),
			{ includeIndex: true, forUserQuery: true },
		)
		expect(stringGetIdFromUserMock).not.toHaveBeenCalled()
		expect(getIdFromUser).toHaveBeenCalledExactlyOnceWith(config, list, undefined)
	})

	it('builds prompt message automatically from name', async () => {
		outputListMock.mockResolvedValue(list)
		const configWithName = { ...config, itemName: 'thingamabob' }

		expect(await promptUser(command, configWithName, { listItems: listItemsMock }))
			.toBe('chosen-id')

		expect(listItemsMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			configWithName,
			expect.any(Function),
			{ includeIndex: true, forUserQuery: true },
		)
		expect(stringGetIdFromUserMock).toHaveBeenCalledExactlyOnceWith(configWithName, list, 'Select a thingamabob.')
	})

	it('passes custom prompt on', async () => {
		outputListMock.mockResolvedValue(list)

		const options = { listItems: listItemsMock, promptMessage: 'custom prompt' }
		expect(await promptUser(command, config, options)).toBe('chosen-id')

		expect(listItemsMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			config,
			expect.any(Function),
			{ includeIndex: true, forUserQuery: true },
		)
		expect(stringGetIdFromUserMock).toHaveBeenCalledExactlyOnceWith(config, list, 'custom prompt')
	})
})

describe('selectFromList', () => {
	const getItemMock = jest.fn<LookupDataFunction<string, SimpleType>>()
	const userMessageMock = jest.fn<(item: SimpleType) => string>()
	const defaultValue: SelectOptions<SimpleType>['defaultValue'] = {
		configKey: 'defaultItem',
		getItem: getItemMock,
		userMessage: userMessageMock,
	}

	it('returns id when present', async () => {
		const options = { preselectedId: 'sample-id', listItems: listItemsMock }
		expect(await selectFromList(command, config, options)).toBe('sample-id')

		expect(listItemsMock).not.toHaveBeenCalled()
		expect(outputListMock).not.toHaveBeenCalled()
		expect(stringGetIdFromUserMock).not.toHaveBeenCalled()

		expect(booleanConfigValueMock).not.toHaveBeenCalled()
		expect(promptMock).not.toHaveBeenCalled()
		expect(setConfigKeyMock).not.toHaveBeenCalled()
		expect(getItemMock).not.toHaveBeenCalled()
		expect(userMessageMock).not.toHaveBeenCalled()
		expect(resetManagedConfigKeyMock).not.toHaveBeenCalled()
	})

	it('uses promptUser when no preselected id included', async () => {
		expect(await selectFromList(command, config, { listItems: listItemsMock }))
			.toBe('chosen-id')

		expect(listItemsMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledTimes(1)
		expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(1)

		expect(booleanConfigValueMock).not.toHaveBeenCalled()
		expect(promptMock).not.toHaveBeenCalled()
		expect(setConfigKeyMock).not.toHaveBeenCalled()
		expect(getItemMock).not.toHaveBeenCalled()
		expect(userMessageMock).not.toHaveBeenCalled()
		expect(resetManagedConfigKeyMock).not.toHaveBeenCalled()
	})

	it('returns saved default', async () => {
		const commandWithDefault = commandWithProfile({
			defaultItem: 'default-item-id',
		})
		getItemMock.mockResolvedValueOnce(item1)
		userMessageMock.mockReturnValueOnce('user message')

		const options = { listItems: listItemsMock, defaultValue }
		expect(await selectFromList(commandWithDefault, config, options)).toBe('default-item-id')

		expect(consoleLogSpy).toHaveBeenCalledWith('user message')

		expect(listItemsMock).not.toHaveBeenCalled()
		expect(outputListMock).not.toHaveBeenCalled()
		expect(stringGetIdFromUserMock).not.toHaveBeenCalled()

		expect(booleanConfigValueMock).not.toHaveBeenCalled()
		expect(promptMock).not.toHaveBeenCalled()
		expect(setConfigKeyMock).not.toHaveBeenCalled()
		expect(userMessageMock).toHaveBeenCalledExactlyOnceWith(item1)
		expect(resetManagedConfigKeyMock).not.toHaveBeenCalled()
	})

	it('ignores and clears saved default when no item returned', async () => {
		const commandWithDefault = commandWithProfile({
			defaultItem: 'default-item-id',
		})
		getItemMock.mockResolvedValueOnce(undefined as unknown as SimpleType)
		promptMock.mockResolvedValue({ answer: 'No' })

		const options = { listItems: listItemsMock, defaultValue }
		expect(await selectFromList(commandWithDefault, config, options)).toBe('chosen-id')

		expect(listItemsMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledTimes(1)
		expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(1)

		expect(booleanConfigValueMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(setConfigKeyMock).not.toHaveBeenCalled()
		expect(getItemMock).toHaveBeenCalledExactlyOnceWith('default-item-id')
		expect(userMessageMock).not.toHaveBeenCalled()
		expect(resetManagedConfigKeyMock)
			.toHaveBeenCalledExactlyOnceWith(commandWithDefault.cliConfig, 'defaultItem')
	})

	it.each([403, 404])(
		'ignores and clears saved default exception with status code %d',
		async statusCode => {
			const commandWithDefault = commandWithProfile({
				defaultItem: 'default-item-id',
			})
			getItemMock.mockRejectedValueOnce({ response: { status: statusCode } })
			promptMock.mockResolvedValue({ answer: 'No' })

			const options = { listItems: listItemsMock, defaultValue }
			expect(await selectFromList(commandWithDefault, config, options)).toBe('chosen-id')

			expect(listItemsMock).toHaveBeenCalledTimes(1)
			expect(outputListMock).toHaveBeenCalledTimes(1)
			expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(1)

			expect(booleanConfigValueMock).toHaveBeenCalledTimes(1)
			expect(promptMock).toHaveBeenCalledTimes(1)
			expect(setConfigKeyMock).not.toHaveBeenCalled()
			expect(getItemMock).toHaveBeenCalledExactlyOnceWith('default-item-id')
			expect(userMessageMock).not.toHaveBeenCalled()
			expect(resetManagedConfigKeyMock)
				.toHaveBeenCalledExactlyOnceWith(commandWithDefault.cliConfig, 'defaultItem')
		},
	)

	it('rethrows unexpected error from defaultConfig.getItem', async () => {
		const commandWithDefault = commandWithProfile({
			defaultItem: 'default-item-id',
		})
		getItemMock.mockRejectedValueOnce(Error('unexpected error'))
		promptMock.mockResolvedValue({ answer: 'No' })

		const options = { listItems: listItemsMock, defaultValue }
		await expect(selectFromList(commandWithDefault, config, options))
			.rejects.toThrow('unexpected error')

		expect(listItemsMock).not.toHaveBeenCalled()
		expect(outputListMock).not.toHaveBeenCalled()
		expect(stringGetIdFromUserMock).not.toHaveBeenCalled()

		expect(booleanConfigValueMock).not.toHaveBeenCalled()
		expect(promptMock).not.toHaveBeenCalled()
		expect(setConfigKeyMock).not.toHaveBeenCalled()
		expect(getItemMock).toHaveBeenCalledExactlyOnceWith('default-item-id')
		expect(userMessageMock).not.toHaveBeenCalled()
		expect(resetManagedConfigKeyMock).not.toHaveBeenCalled()
	})

	it('does not save default when user asked not to', async () => {
		booleanConfigValueMock.mockReturnValueOnce(false)
		promptMock.mockResolvedValue({ answer: 'No' })

		expect(await selectFromList(command, config,
			{ listItems: listItemsMock, defaultValue })).toBe('chosen-id')

		expect(listItemsMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledTimes(1)
		expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(1)

		expect(booleanConfigValueMock)
			.toHaveBeenCalledExactlyOnceWith('defaultItem::neverAskForSaveAgain')
		expect(promptMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ type: 'list', name: 'answer' }),
		)
		expect(setConfigKeyMock).not.toHaveBeenCalled()
	})

	it('does not prompt to save default when default key specified but user said never again', async () => {
		booleanConfigValueMock.mockReturnValueOnce(true)

		expect(await selectFromList(command, config,
			{ listItems: listItemsMock, defaultValue })).toBe('chosen-id')

		expect(listItemsMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledTimes(1)
		expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(1)

		expect(booleanConfigValueMock)
			.toHaveBeenCalledExactlyOnceWith('defaultItem::neverAskForSaveAgain')
		expect(promptMock).not.toHaveBeenCalled()
		expect(setConfigKeyMock).not.toHaveBeenCalled()
	})

	it('saves selected item as default', async () => {
		booleanConfigValueMock.mockReturnValueOnce(false)
		promptMock.mockResolvedValue({ answer: 'yes' })

		expect(await selectFromList(command, config,
			{ listItems: listItemsMock, defaultValue })).toBe('chosen-id')

		expect(listItemsMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledTimes(1)
		expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(1)

		expect(booleanConfigValueMock)
			.toHaveBeenCalledExactlyOnceWith('defaultItem::neverAskForSaveAgain')
		expect(promptMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ type: 'list', name: 'answer' }),
		)
		expect(setConfigKeyMock)
			.toHaveBeenCalledExactlyOnceWith(command.cliConfig, 'defaultItem', 'chosen-id')
		expect(consoleLogSpy).toHaveBeenCalledWith('chosen-id is now the default.\n' +
			'You can reset these settings using the config:reset command.')
	})

	it('saves "never ask again" response"', async () => {
		booleanConfigValueMock.mockReturnValueOnce(false)
		promptMock.mockResolvedValue({ answer: 'never' })

		expect(await selectFromList(command, config,
			{ listItems: listItemsMock, defaultValue })).toBe('chosen-id')

		expect(listItemsMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledTimes(1)
		expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(1)

		expect(booleanConfigValueMock).toHaveBeenCalledTimes(1)
		expect(booleanConfigValueMock).toHaveBeenCalledWith('defaultItem::neverAskForSaveAgain')
		expect(promptMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ type: 'list', name: 'answer' }),
		)
		expect(setConfigKeyMock).toHaveBeenCalledExactlyOnceWith(
			command.cliConfig,
			'defaultItem::neverAskForSaveAgain',
			true,
		)
		expect(consoleLogSpy).toHaveBeenCalledWith('You will not be asked again.\n' +
			'You can reset these settings using the config:reset command.')
	})
})
