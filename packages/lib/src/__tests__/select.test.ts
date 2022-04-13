import inquirer from 'inquirer'

import { outputList } from '../basic-io'
import { Profile, setConfigKey } from '../cli-config'
import { stringGetIdFromUser } from '../command-util'
import { indefiniteArticleFor, promptUser, selectFromList } from '../select'
import { SmartThingsCommandInterface } from '../smartthings-command'
import { buildMockCommand, exitMock } from './test-lib/mock-command'


jest.mock('../cli-config')
jest.mock('../command-util')
jest.mock('../basic-io')
jest.mock('@oclif/core')

describe('select', () => {
	const item1 = { str: 'string-id-1', num: 5 }
	const item2 = { str: 'string-id-2', num: 7 }
	const list = [item1, item2]
	const singleItemList = [item1]
	const booleanConfigValueMock = jest.fn()

	const commandWithProfile = (profile: Profile): SmartThingsCommandInterface => ({
		...buildMockCommand({ output: 'output.yaml' }, profile),
		booleanConfigValue: booleanConfigValueMock,
	})
	const command = commandWithProfile({})
	const config = {
		tableFieldDefinitions: [],
		primaryKeyName: 'str',
		sortKeyName: 'num',
	}

	const listItems = jest.fn()
	const stringGetIdFromUserMock = jest.mocked(stringGetIdFromUser)
	const outputListMock = jest.mocked(outputList)


	describe('indefiniteArticleFor', () => {
		it.each(['apple', 'Animal', 'egret', 'item', 'orange', 'unicorn'])('returns "an" for "%s"', word => {
			expect(indefiniteArticleFor(word)).toBe('an')
		})

		it.each(['banana', 'Balloon', 'tree'])('returns "a" for "%s"', word => {
			expect(indefiniteArticleFor(word)).toBe('a')
		})
	})

	describe('promptUser', () => {
		it('works with defaults', async () => {
			const listItems = jest.fn().mockResolvedValueOnce(list)
			outputListMock.mockResolvedValueOnce(list)
			stringGetIdFromUserMock.mockResolvedValue('chosen-id')

			expect(await promptUser(command, config, { listItems })).toBe('chosen-id')

			expect(listItems).toHaveBeenCalledTimes(1)
			expect(listItems).toHaveBeenCalledWith()
			expect(outputListMock).toHaveBeenCalledTimes(1)
			expect(outputListMock).toHaveBeenCalledWith(command, config, expect.any(Function), true, true)
			expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(1)
			expect(stringGetIdFromUserMock).toHaveBeenCalledWith(config, list, undefined)

			// Anonymous function passed to outputList should return same list as listItems
			// without calling it again.
			const anonymousListFunction = outputListMock.mock.calls[0][2]
			expect(await anonymousListFunction()).toBe(list)
			expect(listItems).toHaveBeenCalledTimes(1)
		})

		it('autoChoose default to false', async () => {
			const listItems = jest.fn().mockResolvedValueOnce(singleItemList)
			outputListMock.mockResolvedValueOnce(singleItemList)
			stringGetIdFromUserMock.mockResolvedValue('chosen-id')

			expect(await promptUser(command, config, { listItems })).toBe('chosen-id')

			expect(listItems).toHaveBeenCalledTimes(1)
			expect(listItems).toHaveBeenCalledWith()
			expect(outputListMock).toHaveBeenCalledTimes(1)
			expect(outputListMock).toHaveBeenCalledWith(command, config, expect.any(Function), true, true)
			expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(1)
			expect(stringGetIdFromUserMock).toHaveBeenCalledWith(config, singleItemList, undefined)
		})

		it('chooses single item automatically if autoChoose is on', async () => {
			const listItems = jest.fn().mockResolvedValueOnce(singleItemList)

			expect(await promptUser(command, config, { listItems, autoChoose: true })).toBe('string-id-1')

			expect(listItems).toHaveBeenCalledTimes(1)
			expect(listItems).toHaveBeenCalledWith()
			expect(outputListMock).toHaveBeenCalledTimes(0)
			expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(0)
		})

		it('exits when nothing to select from', async () => {
			outputListMock.mockResolvedValue([])
			// fake exiting with a special thrown error
			exitMock.mockImplementation(() => { throw Error('should exit') })

			await expect(selectFromList(command, config, { listItems })).rejects.toThrow('should exit')

			expect(listItems).toHaveBeenCalledTimes(1)
			expect(outputListMock).toHaveBeenCalledTimes(1)
			expect(outputListMock).toHaveBeenCalledWith(command, config, expect.any(Function), true, true)
			expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(0)
		})
		it('calls custom getIdFromUser when specified', async () => {
			const listItems = jest.fn().mockResolvedValueOnce(list)
			outputListMock.mockResolvedValueOnce(list)

			const getIdFromUser = jest.fn().mockResolvedValueOnce('special-id')

			expect(await promptUser(command, config, { listItems, getIdFromUser })).toBe('special-id')

			expect(listItems).toHaveBeenCalledTimes(1)
			expect(listItems).toHaveBeenCalledWith()
			expect(outputListMock).toHaveBeenCalledTimes(1)
			expect(outputListMock).toHaveBeenCalledWith(command, config, expect.any(Function), true, true)
			expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(0)
			expect(getIdFromUser).toHaveBeenCalledTimes(1)
			expect(getIdFromUser).toHaveBeenCalledWith(config, list, undefined)
		})

		it('builds prompt message automatically from name', async () => {
			outputListMock.mockResolvedValue(list)
			const configWithName = { ...config, itemName: 'thingamabob' }

			expect(await selectFromList(command, configWithName, { listItems })).toBe('chosen-id')

			expect(listItems).toHaveBeenCalledTimes(1)
			expect(outputListMock).toHaveBeenCalledTimes(1)
			expect(outputListMock).toHaveBeenCalledWith(command, configWithName, expect.any(Function), true, true)
			expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(1)
			expect(stringGetIdFromUserMock).toHaveBeenCalledWith(configWithName, list, 'Select a thingamabob.')
		})

		it('passes custom prompt on', async () => {
			outputListMock.mockResolvedValue(list)

			expect(await selectFromList(command, config, { listItems, promptMessage: 'custom prompt' }))
				.toBe('chosen-id')

			expect(listItems).toHaveBeenCalledTimes(1)
			expect(outputListMock).toHaveBeenCalledTimes(1)
			expect(outputListMock).toHaveBeenCalledWith(command, config, expect.any(Function), true, true)
			expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(1)
			expect(stringGetIdFromUserMock).toHaveBeenCalledWith(config, list, 'custom prompt')
		})
	})

	describe('selectFromList', () => {
		const promptSpy = jest.spyOn(inquirer, 'prompt')
		const setConfigKeyMock = jest.mocked(setConfigKey)

		it('returns id when present', async () => {
			expect(await selectFromList(command, config, { preselectedId: 'sample-id', listItems }))
				.toBe('sample-id')

			expect(listItems).toHaveBeenCalledTimes(0)
			expect(outputListMock).toHaveBeenCalledTimes(0)
			expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(0)

			expect(booleanConfigValueMock).toHaveBeenCalledTimes(0)
			expect(promptSpy).toHaveBeenCalledTimes(0)
			expect(setConfigKeyMock).toHaveBeenCalledTimes(0)
		})

		it('uses promptUser when no preselected id included', async () => {
			expect(await selectFromList(command, config, { listItems }))
				.toBe('chosen-id')

			expect(listItems).toHaveBeenCalledTimes(1)
			expect(outputListMock).toHaveBeenCalledTimes(1)
			expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(1)

			expect(booleanConfigValueMock).toHaveBeenCalledTimes(0)
			expect(promptSpy).toHaveBeenCalledTimes(0)
			expect(setConfigKeyMock).toHaveBeenCalledTimes(0)
		})

		it('returns saved default', async () => {
			const commandWithDefault = commandWithProfile({
				defaultItem: 'default-item-id',
			})
			promptSpy.mockResolvedValue({ answer: 'No' })

			expect(await selectFromList(commandWithDefault, config,
				{ listItems, configKeyForDefaultValue: 'defaultItem' })).toBe('default-item-id')

			expect(listItems).toHaveBeenCalledTimes(0)
			expect(outputListMock).toHaveBeenCalledTimes(0)
			expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(0)

			expect(booleanConfigValueMock).toHaveBeenCalledTimes(0)
			expect(promptSpy).toHaveBeenCalledTimes(0)
			expect(setConfigKeyMock).toHaveBeenCalledTimes(0)
		})

		it('does not save default when user asked not to', async () => {
			booleanConfigValueMock.mockReturnValueOnce(false)
			promptSpy.mockResolvedValue({ answer: 'No' })

			expect(await selectFromList(command, config,
				{ listItems, configKeyForDefaultValue: 'defaultItem' })).toBe('chosen-id')

			expect(listItems).toHaveBeenCalledTimes(1)
			expect(outputListMock).toHaveBeenCalledTimes(1)
			expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(1)

			expect(booleanConfigValueMock).toHaveBeenCalledTimes(1)
			expect(booleanConfigValueMock).toHaveBeenCalledWith('defaultItem::neverAskForSaveAgain')
			expect(promptSpy).toHaveBeenCalledTimes(1)
			expect(promptSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'list', name: 'answer' }))
			expect(setConfigKeyMock).toHaveBeenCalledTimes(0)
		})

		it('does not prompt to save default when default key specified but user said never again', async () => {
			booleanConfigValueMock.mockReturnValueOnce(true)

			expect(await selectFromList(command, config,
				{ listItems, configKeyForDefaultValue: 'defaultItem' })).toBe('chosen-id')

			expect(listItems).toHaveBeenCalledTimes(1)
			expect(outputListMock).toHaveBeenCalledTimes(1)
			expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(1)

			expect(booleanConfigValueMock).toHaveBeenCalledTimes(1)
			expect(booleanConfigValueMock).toHaveBeenCalledWith('defaultItem::neverAskForSaveAgain')
			expect(promptSpy).toHaveBeenCalledTimes(0)
			expect(setConfigKeyMock).toHaveBeenCalledTimes(0)
		})

		it('saves selected item as default', async () => {
			booleanConfigValueMock.mockReturnValueOnce(false)
			promptSpy.mockResolvedValue({ answer: 'yes' })

			expect(await selectFromList(command, config,
				{ listItems, configKeyForDefaultValue: 'defaultItem' })).toBe('chosen-id')

			expect(listItems).toHaveBeenCalledTimes(1)
			expect(outputListMock).toHaveBeenCalledTimes(1)
			expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(1)

			expect(booleanConfigValueMock).toHaveBeenCalledTimes(1)
			expect(booleanConfigValueMock).toHaveBeenCalledWith('defaultItem::neverAskForSaveAgain')
			expect(promptSpy).toHaveBeenCalledTimes(1)
			expect(promptSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'list', name: 'answer' }))
			expect(setConfigKeyMock).toHaveBeenCalledTimes(1)
			expect(setConfigKeyMock).toHaveBeenCalledWith(command.cliConfig, 'defaultItem', 'chosen-id')
		})

		it('saves "never ask again" response"', async () => {
			booleanConfigValueMock.mockReturnValueOnce(false)
			promptSpy.mockResolvedValue({ answer: 'never' })

			expect(await selectFromList(command, config,
				{ listItems, configKeyForDefaultValue: 'defaultItem' })).toBe('chosen-id')

			expect(listItems).toHaveBeenCalledTimes(1)
			expect(outputListMock).toHaveBeenCalledTimes(1)
			expect(stringGetIdFromUserMock).toHaveBeenCalledTimes(1)

			expect(booleanConfigValueMock).toHaveBeenCalledTimes(1)
			expect(booleanConfigValueMock).toHaveBeenCalledWith('defaultItem::neverAskForSaveAgain')
			expect(promptSpy).toHaveBeenCalledTimes(1)
			expect(promptSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'list', name: 'answer' }))
			expect(setConfigKeyMock).toHaveBeenCalledTimes(1)
			expect(setConfigKeyMock).toHaveBeenCalledWith(command.cliConfig, 'defaultItem::neverAskForSaveAgain', true)
		})
	})
})
