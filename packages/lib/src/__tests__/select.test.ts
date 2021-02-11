import { selectFromList } from '../select'
import * as basicIO from '../basic-io'
import * as commandUtil from '../command-util'
import { buildMockCommand, exitMock } from './test-lib/mock-command'


describe('select', () => {
	const item = { str: 'string-id', num: 5 }
	const list = [item]
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

	describe('selectFromList', () => {
		it('returns id when present', async () => {
			expect(await selectFromList(command, config, 'sample-id', listFunction)).toBe('sample-id')
			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(outputListSpy).toHaveBeenCalledTimes(0)
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(0)
		})

		it('gets list and asks user for selection with no id', async () => {
			outputListSpy.mockResolvedValue(list)

			const resultId = await selectFromList(command, config, undefined, listFunction)

			expect(resultId).toBe('chosen id')
			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(outputListSpy).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledWith(command, config, listFunction, true)
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(1)
			expect(getIdFromUserSpy).toHaveBeenCalledWith(config, list, undefined)
		})

		it('passes custom prompt on', async () => {
			outputListSpy.mockResolvedValue(list)

			const resultId = await selectFromList(command, config, undefined, listFunction, 'custom prompt')

			expect(resultId).toBe('chosen id')
			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(outputListSpy).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledWith(command, config, listFunction, true)
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(1)
			expect(getIdFromUserSpy).toHaveBeenCalledWith(config, list, 'custom prompt')
		})

		it('exits when nothing to select from', async () => {
			outputListSpy.mockResolvedValue([])
			// fake exiting with a special thrown error
			exitMock.mockImplementation(() => { throw Error('should exit') })

			await expect(selectFromList(command, config, undefined, listFunction)).rejects.toThrow('should exit')

			expect(listFunction).toHaveBeenCalledTimes(0)
			expect(outputListSpy).toHaveBeenCalledTimes(1)
			expect(outputListSpy).toHaveBeenCalledWith(command, config, listFunction, true)
			expect(getIdFromUserSpy).toHaveBeenCalledTimes(0)
		})
	})
})
