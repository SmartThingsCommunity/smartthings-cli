import { selectActOnAndOutput, selectActOnAndOutputGeneric, selectAndActOn, selectAndActOnGeneric } from '../acting-io'
import * as basicIO from '../basic-io'
import * as commandUtil from '../command-util'
import * as format from '../format'
import { buildMockCommand, exitMock } from './test-lib/mock-command'


describe('acting-io', () => {
	const item = { str: 'string-id', num: 5 }
	const list = [item]
	const command = {
		...buildMockCommand(),
		flags: {
			output: 'output.yaml',
		},
		tableFieldDefinitions: [],
		primaryKeyName: 'str',
		sortKeyName: 'num',
	}

	const listFunction = jest.fn()
	const actionFunction = jest.fn().mockResolvedValue(item)
	const getIdFromUser = jest.fn().mockResolvedValue('chosen id')
	const getIdFromUserSpy = jest.spyOn(commandUtil, 'stringGetIdFromUser').mockResolvedValue('chosen id')
	const writeSpy = jest.spyOn(process.stdout, 'write').mockReturnValue(true)

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('selectAndActOnGeneric', () => {
		const outputListSpy = jest.spyOn(basicIO, 'outputList')

		it('acts on specified id', async () => {
			const [resultId, resultItem] = await selectAndActOnGeneric(command, 'id', listFunction,
				actionFunction, getIdFromUser)

			expect(resultId).toBe('id')
			expect(resultItem).toBe(item)
			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(actionFunction).toHaveBeenCalledTimes(1)
			expect(actionFunction).toHaveBeenCalledWith('id')
			expect(getIdFromUser).toHaveBeenCalledTimes(0)
		})

		it('gets list and asks user for selection with no id', async () => {
			outputListSpy.mockResolvedValue(list)

			const [resultId, resultItem] = await selectAndActOnGeneric(command, undefined,
				listFunction, actionFunction, getIdFromUser)

			expect(resultId).toBe('chosen id')
			expect(resultItem).toBe(item)
			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(outputListSpy).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledWith(command, listFunction, true)
			expect(actionFunction).toHaveBeenCalledTimes(1)
			expect(actionFunction).toHaveBeenCalledWith('chosen id')
			expect(getIdFromUser).toHaveBeenCalledTimes(1)
			expect(getIdFromUser).toHaveBeenCalledWith(command, list)
		})

		it('substitutes computed id for {{id}} in success message', async () => {
			const [resultId] = await selectAndActOnGeneric(command, 'world',
				listFunction, actionFunction, getIdFromUser, 'hello {{id}}')

			expect(resultId).toBe('world')
			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(actionFunction).toHaveBeenCalledTimes(1)
			expect(actionFunction).toHaveBeenCalledWith('world')
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(0)
			expect(writeSpy).toHaveBeenCalledTimes(1)
			expect(writeSpy).toHaveBeenCalledWith('hello "world"\n')
		})

		it('exits when nothing to select from', async () => {
			outputListSpy.mockResolvedValue([])
			// fake exiting with a special thrown error
			exitMock.mockImplementation(() => { throw Error('should exit') })

			await expect(selectAndActOnGeneric(command, undefined, listFunction, actionFunction,
				getIdFromUser)).rejects.toThrow('should exit')

			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(outputListSpy).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledWith(command, listFunction, true)
			expect(actionFunction).toHaveBeenCalledTimes(0)
			expect(getIdFromUser).toHaveBeenCalledTimes(0)
		})
	})

	describe('selectAndActOn', () => {
		const outputListSpy = jest.spyOn(basicIO, 'outputList')

		it('acts on specified id', async () => {
			const resultId = await selectAndActOn(command, 'id', listFunction, actionFunction, 'success')

			expect(resultId).toBe('id')
			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(actionFunction).toHaveBeenCalledTimes(1)
			expect(actionFunction).toHaveBeenCalledWith('id')
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(0)
			expect(writeSpy).toHaveBeenCalledTimes(1)
			expect(writeSpy).toHaveBeenCalledWith('success\n')
		})

		it('gets list and asks user for selection with no id', async () => {
			outputListSpy.mockResolvedValue(list)

			const resultId = await selectAndActOn(command, undefined, listFunction, actionFunction, 'success')

			expect(resultId).toBe('chosen id')
			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(outputListSpy).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledWith(command, listFunction, true)
			expect(actionFunction).toHaveBeenCalledTimes(1)
			expect(actionFunction).toHaveBeenCalledWith('chosen id')
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(1)
			expect(getIdFromUserSpy).toHaveBeenCalledWith(command, list)
			expect(writeSpy).toHaveBeenCalledTimes(1)
			expect(writeSpy).toHaveBeenCalledWith('success\n')
		})

		it('exits when nothing to select from', async () => {
			outputListSpy.mockResolvedValue([])
			// fake exiting with a special thrown error
			exitMock.mockImplementation(() => { throw Error('should exit') })

			await expect(selectAndActOn(command, undefined, listFunction, actionFunction, 'x')).rejects.toThrow('should exit')

			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(outputListSpy).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledWith(command, listFunction, true)
			expect(actionFunction).toHaveBeenCalledTimes(0)
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(0)
		})

		it('substitutes computed id for {{id}} in success message', async () => {
			const resultId = await selectAndActOn(command, 'my-awesome-id', listFunction, actionFunction, '123 {{id}} 321')

			expect(resultId).toBe('my-awesome-id')
			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(actionFunction).toHaveBeenCalledTimes(1)
			expect(actionFunction).toHaveBeenCalledWith('my-awesome-id')
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(0)
			expect(writeSpy).toHaveBeenCalledTimes(1)
			expect(writeSpy).toHaveBeenCalledWith('123 "my-awesome-id" 321\n')
		})
	})

	describe('selectActOnAndOutput', () => {
		const formatAndWriteItemSpy = jest.spyOn(format, 'formatAndWriteItem').mockImplementation(async () => { /* skip */ })

		it('selectActOnAndOutputGeneric writes output', async () => {
			const [resultId, resultItem] = await selectActOnAndOutputGeneric(command, 'id', listFunction,
				actionFunction, getIdFromUser)

			expect(resultId).toBe('id')
			expect(resultItem).toBe(item)
			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(actionFunction).toHaveBeenCalledTimes(1)
			expect(actionFunction).toHaveBeenCalledWith('id')
			expect(getIdFromUser).toHaveBeenCalledTimes(0)

			expect(formatAndWriteItemSpy).toHaveBeenCalledTimes(1)
			expect(formatAndWriteItemSpy).toHaveBeenCalledWith(command, resultItem)
		})

		it('selectActOnAndOutput writes output', async () => {
			const [resultId, resultItem] = await selectActOnAndOutput(command, 'id', listFunction, actionFunction)

			expect(resultId).toBe('id')
			expect(resultItem).toBe(item)
			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(actionFunction).toHaveBeenCalledTimes(1)
			expect(actionFunction).toHaveBeenCalledWith('id')
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(0)

			expect(formatAndWriteItemSpy).toHaveBeenCalledTimes(1)
			expect(formatAndWriteItemSpy).toHaveBeenCalledWith(command, resultItem)
		})
	})
})
