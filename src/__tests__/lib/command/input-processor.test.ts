import { jest } from '@jest/globals'

import { readFile } from 'fs/promises'

import {
	CommandLineInputCommand,
	InputProcessor,
	UserInputCommand,
} from '../../../lib/command/input-processor.js'
import {
	formatFromFilename,
	parseJSONOrYAML,
	readDataFromStdin,
	stdinIsTTY,
} from '../../../lib/io-util.js'
import { SimpleType, validData } from '../../test-lib/simple-type.js'


const readFileMock = jest.fn<typeof readFile>()
jest.unstable_mockModule('fs/promises', () => ({
	readFile: readFileMock,
}))

const formatFromFilenameMock = jest.fn<typeof formatFromFilename>()
const parseJSONOrYAMLMock = jest.fn<typeof parseJSONOrYAML>()
const readDataFromStdinMock = jest.fn<typeof readDataFromStdin>()
const stdinIsTTYMock = jest.fn<typeof stdinIsTTY>()
jest.unstable_mockModule('../../../lib/io-util.js', () => ({
	formatFromFilename: formatFromFilenameMock,
	parseJSONOrYAML: parseJSONOrYAMLMock,
	readDataFromStdin: readDataFromStdinMock,
	stdinIsTTY: stdinIsTTYMock,
}))


const {
	combinedInputProcessor,
	commandLineInputProcessor,
	fileInputProcessor,
	inputProcessor,
	stdinInputProcessor,
	userInputProcessor,
} = await import('../../../lib/command/input-processor.js')


describe('fileInputProcessor', () => {
	it('gets format from filename', () => {
		formatFromFilenameMock.mockReturnValueOnce('json')
		expect(fileInputProcessor('fn').ioFormat).toBe('json')
		expect(formatFromFilenameMock).toHaveBeenCalledWith('fn')
	})

	it('hasInput returns false for no filename', () =>  {
		const processor = fileInputProcessor()
		expect(processor.hasInput()).toBe(false)
	})

	it('throws exception on read with no filename', () =>  {
		const processor = fileInputProcessor()
		expect(processor.hasInput()).toBe(false)
		return expect(processor.read()).rejects.toEqual(ReferenceError('read called when hasInput returns false'))
	})

	it('returns data as expected', async () =>  {
		const processor = fileInputProcessor('input filename')

		readFileMock.mockResolvedValueOnce('yaml file data')
		parseJSONOrYAMLMock.mockReturnValueOnce(validData)

		expect(processor.hasInput()).toBe(true)
		expect(await processor.read()).toEqual(validData)

		expect(readFileMock).toHaveBeenCalledTimes(1)
		expect(readFileMock).toHaveBeenCalledWith('input filename', 'utf-8')
		expect(parseJSONOrYAMLMock).toHaveBeenCalledTimes(1)
		expect(parseJSONOrYAMLMock).toHaveBeenCalledWith('yaml file data', 'input filename')
	})
})

describe('stdinInputProcessor', () => {
	it('specifies JSON format', () =>  {
		expect(stdinInputProcessor().ioFormat).toBe('json')
	})

	it('hasInput returns false for TTY input', async () =>  {
		stdinIsTTYMock.mockReturnValueOnce(true)
		const processor = stdinInputProcessor()

		expect(await processor.hasInput()).toBe(false)

		expect(stdinIsTTYMock).toHaveBeenCalledTimes(1)
	})

	it('hasInput returns false for empty TTY input', async () =>  {
		readDataFromStdinMock.mockResolvedValueOnce('')
		stdinIsTTYMock.mockReturnValueOnce(false)
		const processor = stdinInputProcessor()

		expect(await processor.hasInput()).toBe(false)

		expect(stdinIsTTYMock).toHaveBeenCalledTimes(1)
		expect(readDataFromStdinMock).toHaveBeenCalledTimes(1)
	})

	it('processes valid YAML into object', async () =>  {
		const processor = stdinInputProcessor()

		stdinIsTTYMock.mockReturnValueOnce(false)
		readDataFromStdinMock.mockResolvedValueOnce('some yaml')

		expect(await processor.hasInput()).toBe(true)

		expect(stdinIsTTYMock).toHaveBeenCalledTimes(1)
		expect(readDataFromStdinMock).toHaveBeenCalledTimes(1)

		parseJSONOrYAMLMock.mockReturnValueOnce(validData)

		const result = await processor.read()

		expect(parseJSONOrYAMLMock).toHaveBeenCalledWith('some yaml', 'stdin')
		expect(result).toBe(validData)
	})

	it('throws exception when read called before hasInput', async () => {
		const processor = stdinInputProcessor()

		await expect(processor.read()).rejects
			.toThrow('invalid state; `hasInput` was not called or returned false')
	})
})

describe('simple input processor builder functions', () => {
	const hasInputMock = jest.fn<() => boolean>()
	const readMock = jest.fn<() => Promise<string>>()

	it('inputBuilder defaults to common input', () => {
		const result = inputProcessor(hasInputMock, readMock)

		expect(result.hasInput).toBe(hasInputMock)
		expect(result.read).toBe(readMock)
		expect(result.ioFormat).toBe('common')
	})

	it('inputBuilder uses specified ioFormat', () => {
		const result = inputProcessor(hasInputMock, readMock, 'json')

		expect(result.hasInput).toBe(hasInputMock)
		expect(result.read).toBe(readMock)
		expect(result.ioFormat).toBe('json')
	})

	it('commandLineInputProcessor uses proper methods from command', async () => {
		const command: CommandLineInputCommand<string> = {
			hasCommandLineInput: hasInputMock,
			getInputFromCommandLine: readMock,
		}

		const inputProcessor = commandLineInputProcessor(command)

		expect(inputProcessor.ioFormat).toBe('common')

		hasInputMock.mockReturnValueOnce(true)
		expect(inputProcessor.hasInput()).toBe(true)
		expect(hasInputMock).toHaveBeenCalledTimes(1)

		readMock.mockResolvedValueOnce('happy return value')
		expect(await inputProcessor.read()).toBe('happy return value')
		expect(readMock).toHaveBeenCalledTimes(1)
	})

	it('userInputProcessor uses proper methods from command', async () => {
		const command: UserInputCommand<string> = {
			getInputFromUser: readMock,
		}

		const inputProcessor = userInputProcessor(command)

		expect(inputProcessor.ioFormat).toBe('common')

		expect(inputProcessor.hasInput()).toBe(true)

		readMock.mockResolvedValueOnce('happy return value')
		expect(await inputProcessor.read()).toBe('happy return value')
		expect(readMock).toHaveBeenCalledTimes(1)
	})

	it('userInputProcessor passes read function directly to `inputProcessor`', async () => {
		const read: () => Promise<string> = () => Promise.resolve('I have been read by read.')

		const inputProcessor = userInputProcessor(read)

		expect(inputProcessor.ioFormat).toBe('common')
		expect(inputProcessor.hasInput()).toBe(true)

		expect(inputProcessor.read).toBe(read)
	})
})

describe('combinedInputProcessor', () => {
	const hasInputMock1 = jest.fn<() => boolean>()
	const hasInputMock2 = jest.fn<() => Promise<boolean>>()
	const hasInputMock3 = jest.fn<() => Promise<boolean>>()

	const readMock1 = jest.fn<() => Promise<SimpleType>>()
	const readMock2 = jest.fn<() => Promise<SimpleType>>()
	const readMock3 = jest.fn<() => Promise<SimpleType>>()

	const makeProcessor = (hasInputMock: () => boolean | Promise<boolean>, readMock?: () => Promise<SimpleType>): InputProcessor<SimpleType> => ({
		ioFormat: 'common',
		hasInput: hasInputMock,
		read: readMock ? readMock : () => { throw Error('should not be called') },
	})

	it('calls hasInput only as necessary', async () =>  {
		const processor = combinedInputProcessor(makeProcessor(hasInputMock1),
			makeProcessor(hasInputMock2), makeProcessor(hasInputMock3))

		hasInputMock1.mockReturnValueOnce(false)
		hasInputMock2.mockResolvedValueOnce(false)
		hasInputMock3.mockResolvedValueOnce(true)

		expect(await processor.hasInput()).toBe(true)

		expect(hasInputMock1).toHaveBeenCalledTimes(1)
		expect(hasInputMock2).toHaveBeenCalledTimes(1)
		expect(hasInputMock3).toHaveBeenCalledTimes(1)

		jest.clearAllMocks()

		hasInputMock3.mockResolvedValueOnce(false)
		expect(await processor.hasInput()).toBe(false)

		expect(hasInputMock1).toHaveBeenCalledTimes(1)
		expect(hasInputMock2).toHaveBeenCalledTimes(1)
		expect(hasInputMock3).toHaveBeenCalledTimes(1)

		jest.clearAllMocks()

		hasInputMock1.mockReturnValueOnce(false)
		hasInputMock2.mockResolvedValueOnce(true)

		expect(await processor.hasInput()).toBe(true)

		expect(hasInputMock1).toHaveBeenCalledTimes(1)
		expect(hasInputMock2).toHaveBeenCalledTimes(1)
		expect(hasInputMock3).toHaveBeenCalledTimes(0)

		jest.clearAllMocks()

		hasInputMock1.mockReturnValueOnce(true)

		expect(await processor.hasInput()).toBe(true)

		expect(hasInputMock1).toHaveBeenCalledTimes(1)
		expect(hasInputMock2).toHaveBeenCalledTimes(0)
		expect(hasInputMock3).toHaveBeenCalledTimes(0)
	})

	it('calls hasInput in correct order', async () =>  {
		hasInputMock1.mockReturnValueOnce(false)
		hasInputMock2.mockResolvedValueOnce(false)
		hasInputMock3.mockResolvedValueOnce(true)

		const processor = combinedInputProcessor(makeProcessor(hasInputMock1),
			makeProcessor(hasInputMock2), makeProcessor(hasInputMock3))

		expect(await processor.hasInput()).toBe(true)

		expect(hasInputMock1).toHaveBeenCalledTimes(1)
		expect(hasInputMock2).toHaveBeenCalledTimes(1)
		expect(hasInputMock3).toHaveBeenCalledTimes(1)
	})

	it('works with both sync and async hasInput', async () => {
		hasInputMock1.mockReturnValueOnce(false)
		hasInputMock2.mockResolvedValueOnce(false)
		hasInputMock3.mockResolvedValueOnce(true)

		const processor = combinedInputProcessor(makeProcessor(hasInputMock1),
			makeProcessor(hasInputMock2), makeProcessor(hasInputMock3))

		expect(await processor.hasInput()).toBe(true)

		expect(hasInputMock1).toHaveBeenCalledTimes(1)
		expect(hasInputMock2).toHaveBeenCalledTimes(1)
		expect(hasInputMock3).toHaveBeenCalledTimes(1)
	})

	it('throws exception if ioFormat called before read', () => {
		const processor = combinedInputProcessor(makeProcessor(hasInputMock1))

		expect(() => processor.ioFormat).toThrow('ioFormat called before read')
	})

	it('calls read only as necessary', async () =>  {
		const processor = combinedInputProcessor(makeProcessor(hasInputMock1, readMock1),
			makeProcessor(hasInputMock2, readMock2))

		hasInputMock1.mockReturnValueOnce(true)
		readMock1.mockResolvedValueOnce(validData)

		expect(await processor.hasInput()).toBe(true)

		expect(hasInputMock1).toHaveBeenCalledTimes(1)
		expect(hasInputMock2).toHaveBeenCalledTimes(0)

		expect(await processor.read()).toEqual(validData)

		expect(readMock1).toHaveBeenCalledTimes(1)
		expect(readMock2).toHaveBeenCalledTimes(0)
	})

	it('calls read only on correct processor', async () =>  {
		const processor = combinedInputProcessor(makeProcessor(hasInputMock1, readMock1),
			makeProcessor(hasInputMock2, readMock2), makeProcessor(hasInputMock3, readMock3))
		hasInputMock1.mockReturnValueOnce(false)
		hasInputMock2.mockResolvedValueOnce(true)
		readMock2.mockResolvedValueOnce(validData)

		expect(await processor.hasInput()).toBe(true)

		expect(hasInputMock1).toHaveBeenCalledTimes(1)
		expect(hasInputMock2).toHaveBeenCalledTimes(1)
		expect(hasInputMock3).toHaveBeenCalledTimes(0)

		expect(await processor.read()).toEqual(validData)

		expect(readMock1).toHaveBeenCalledTimes(0)
		expect(readMock2).toHaveBeenCalledTimes(1)
		expect(readMock3).toHaveBeenCalledTimes(0)
	})

	it('gets ioFormat from correct processor', async () =>  {
		const processor1 = { ...makeProcessor(hasInputMock1, readMock1), ioFormat: 'json' } as const
		const processor2 = { ...makeProcessor(hasInputMock2, readMock2), ioFormat: 'yaml' } as const
		const processor3 = { ...makeProcessor(hasInputMock3, readMock3), ioFormat: 'common' } as const
		const processor = combinedInputProcessor(processor1, processor2, processor3)
		hasInputMock1.mockReturnValueOnce(false)
		hasInputMock2.mockResolvedValueOnce(true)
		readMock2.mockResolvedValueOnce(validData)

		expect(await processor.hasInput()).toBe(true)

		expect(hasInputMock1).toHaveBeenCalledTimes(1)
		expect(hasInputMock2).toHaveBeenCalledTimes(1)
		expect(hasInputMock3).toHaveBeenCalledTimes(0)

		expect(await processor.read()).toEqual(validData)

		expect(readMock1).toHaveBeenCalledTimes(0)
		expect(readMock2).toHaveBeenCalledTimes(1)
		expect(readMock3).toHaveBeenCalledTimes(0)

		expect(processor.ioFormat).toBe('yaml')
	})

	it('throws exception on read with no filename', async () =>  {
		const processor = combinedInputProcessor(makeProcessor(hasInputMock1, readMock1))
		hasInputMock1.mockReturnValueOnce(false)

		expect(await processor.hasInput()).toBe(false)

		expect(hasInputMock1).toHaveBeenCalledTimes(1)

		await expect(processor.read()).rejects.toThrow(ReferenceError('read called when hasInput returns false'))

		expect(readMock1).toHaveBeenCalledTimes(0)
	})
})
