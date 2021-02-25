import { indefiniteArticleFor, selectFromList, selectGeneric } from '../select'
import * as basicIO from '../basic-io'
import * as commandUtil from '../command-util'
import { buildMockCommand, exitMock } from './test-lib/mock-command'


describe('select', () => {
	const item1 = { str: 'string-id', num: 5 }
	const item2 = { str: 'string-id', num: 5 }
	const list = [item1, item2]
	const command = {
		...buildMockCommand(),
		flags: {
			output: 'output.yaml',
		},
	}
	const config = {
		tableFieldDefinitions: [],
		primaryKeyName: 'str',
		sortKeyName: 'num',
	}

	const listFunction = jest.fn()
	const getIdFromUserSpy = jest.spyOn(commandUtil, 'stringGetIdFromUser').mockResolvedValue('chosen id')
	const outputListSpy = jest.spyOn(basicIO, 'outputList')


	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('indefiniteArticleFor', () => {
		it.each(['apple', 'Animal', 'egret', 'item', 'orange', 'unicorn'])('returns "an" for "%s"', word => {
			expect(indefiniteArticleFor(word)).toBe('an')
		})

		it.each(['banana', 'Balloon', 'tree'])('returns "a" for "%s"', word => {
			expect(indefiniteArticleFor(word)).toBe('a')
		})
	})

	describe('selectGeneric', () => {
		// cover the one test case we can't get at through `selectFromList`.
		it('defaults to autoChoose === false', async () => {
			outputListSpy.mockResolvedValue(list)
			listFunction.mockResolvedValue(list)

			const resultId = await selectGeneric(command, config, undefined, listFunction, commandUtil.stringGetIdFromUser)

			expect(resultId).toBe('chosen id')
			expect(listFunction).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledWith(command, config, expect.any(Function), true, true)
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(1)
			expect(getIdFromUserSpy).toHaveBeenCalledWith(config, list, undefined)

			// Anonymous function passed to outputList should return same list as listFunction
			// without calling it again.
			const anonymousListFunction = outputListSpy.mock.calls[0][2]
			expect(await anonymousListFunction()).toBe(list)
			expect(listFunction).toHaveBeenCalledTimes(1)
		})
	})

	describe('selectFromList', () => {
		it('returns id when present', async () => {
			expect(await selectFromList(command, config, 'sample-id', listFunction)).toBe('sample-id')
			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(outputListSpy).toHaveBeenCalledTimes(0)
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(0)
		})

		it('gets list and asks user for selection with no id', async () => {
			outputListSpy.mockResolvedValue(list)
			listFunction.mockResolvedValue(list)

			const resultId = await selectFromList(command, config, undefined, listFunction)

			expect(resultId).toBe('chosen id')
			expect(listFunction).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledWith(command, config, expect.any(Function), true, true)
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(1)
			expect(getIdFromUserSpy).toHaveBeenCalledWith(config, list, undefined)

			// Anonymous function passed to outputList should return same list as listFunction
			// without calling it again.
			const anonymousListFunction = outputListSpy.mock.calls[0][2]
			expect(await anonymousListFunction()).toBe(list)
			expect(listFunction).toHaveBeenCalledTimes(1)
		})

		it('returns single item automatically when autoChoose on', async () => {
			outputListSpy.mockResolvedValue([item1])
			listFunction.mockResolvedValue([item1])

			const resultId = await selectFromList(command, config, undefined, listFunction, undefined, true)

			expect(resultId).toBe('string-id')
			expect(listFunction).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledTimes(0)
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(0)
		})

		it('gets list and asks users when more than one item, even with autoChoose', async () => {
			outputListSpy.mockResolvedValue(list)
			listFunction.mockResolvedValue(list)

			const resultId = await selectFromList(command, config, undefined, listFunction, undefined, true)

			expect(resultId).toBe('chosen id')
			expect(listFunction).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledWith(command, config, expect.any(Function), true, true)
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(1)
			expect(getIdFromUserSpy).toHaveBeenCalledWith(config, list, undefined)
		})

		it('builds prompt message automatically from name', async () => {
			outputListSpy.mockResolvedValue(list)
			const configWithName = { ...config, itemName: 'thingamabob' }

			const resultId = await selectFromList(command, configWithName, undefined, listFunction)

			expect(resultId).toBe('chosen id')
			expect(listFunction).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledWith(command, configWithName, expect.any(Function), true, true)
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(1)
			expect(getIdFromUserSpy).toHaveBeenCalledWith(configWithName, list, 'Select a thingamabob.')
		})

		it('passes custom prompt on', async () => {
			outputListSpy.mockResolvedValue(list)

			const resultId = await selectFromList(command, config, undefined, listFunction, 'custom prompt')

			expect(resultId).toBe('chosen id')
			expect(listFunction).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledWith(command, config, expect.any(Function), true, true)
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(1)
			expect(getIdFromUserSpy).toHaveBeenCalledWith(config, list, 'custom prompt')
		})

		it('exits when nothing to select from', async () => {
			outputListSpy.mockResolvedValue([])
			// fake exiting with a special thrown error
			exitMock.mockImplementation(() => { throw Error('should exit') })

			await expect(selectFromList(command, config, undefined, listFunction)).rejects.toThrow('should exit')

			expect(listFunction).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledWith(command, config, expect.any(Function), true, true)
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(0)
		})
	})
})
