import {
	CombinedInputProcessor,
	CommandLineInputCommand,
	commandLineInputProcessor,
	FileInputProcessor,
	inputProcessor,
	InputProcessor,
	StdinInputProcessor,
	UserInputCommand,
	userInputProcessor,
} from '../../../lib/command/input-processor.js'
import {
	formatFromFilename,
	parseJSONOrYAML,
	readDataFromStdin,
	readFile,
	stdinIsTTY,
} from '../../../lib/io-util.js'
import { SimpleType, validData } from '../../test-lib/simple-type.js'


jest.mock('../../../lib/io-util.js')

describe('FileInputProcessor', () => {
	it('gets format from filename', () => {
		const formatFromFilenameMock = jest.mocked(formatFromFilename).mockReturnValue('json')
		expect(new FileInputProcessor('fn').ioFormat).toBe('json')
		expect(formatFromFilenameMock).toHaveBeenCalledWith('fn')
	})

	it('hasInput returns false for no filename', () =>  {
		const processor = new FileInputProcessor()
		expect(processor.hasInput()).toBe(false)
	})

	it('throws exception on read with no filename', () =>  {
		const processor = new FileInputProcessor()
		expect(processor.hasInput()).toBe(false)
		return expect(processor.read()).rejects.toEqual(ReferenceError('read called when hasInput returns false'))
	})

	it('returns data as expected', async () =>  {
		const processor = new FileInputProcessor('input filename')

		const readFileMock = jest.mocked(readFile).mockResolvedValueOnce('yaml file data')
		const parseJSONOrYAMLMock = jest.mocked(parseJSONOrYAML).mockReturnValueOnce(validData)

		expect(processor.hasInput()).toBe(true)
		expect(await processor.read()).toEqual(validData)

		expect(readFileMock).toHaveBeenCalledTimes(1)
		expect(readFileMock).toHaveBeenCalledWith('input filename', 'utf-8')
		expect(parseJSONOrYAMLMock).toHaveBeenCalledTimes(1)
		expect(parseJSONOrYAMLMock).toHaveBeenCalledWith('yaml file data', 'input filename')
	})
})

describe('StdinInputProcessor', () => {
	const isTTYMock = jest.mocked(stdinIsTTY)
	const readDataFromStdinMock = jest.mocked(readDataFromStdin)
	const parseJSONOrYAMLMock = jest.mocked(parseJSONOrYAML)

	it('specifies JSON format', () =>  {
		expect(new StdinInputProcessor().ioFormat).toBe('json')
	})

	it('hasInput returns false for TTY input', async () =>  {
		isTTYMock.mockReturnValue(true)
		const processor = new StdinInputProcessor()

		expect(await processor.hasInput()).toBe(false)

		expect(isTTYMock).toHaveBeenCalledTimes(1)
	})

	it('hasInput returns false for empty TTY input', async () =>  {
		const readDataFromStdinMock = jest.mocked(readDataFromStdin).mockResolvedValueOnce('')
		isTTYMock.mockReturnValue(false)
		const processor = new StdinInputProcessor()

		expect(await processor.hasInput()).toBe(false)

		expect(isTTYMock).toHaveBeenCalledTimes(1)
		expect(readDataFromStdinMock).toHaveBeenCalledTimes(1)
	})

	it('processes valid YAML into object', async () =>  {
		const processor = new StdinInputProcessor()

		isTTYMock.mockReturnValue(false)
		readDataFromStdinMock.mockResolvedValue('some yaml')

		expect(await processor.hasInput()).toBe(true)

		expect(isTTYMock).toHaveBeenCalledTimes(1)
		expect(readDataFromStdinMock).toHaveBeenCalledTimes(1)

		parseJSONOrYAMLMock.mockReturnValue(validData)

		const result = await processor.read()

		expect(parseJSONOrYAMLMock).toHaveBeenCalledWith('some yaml', 'stdin')
		expect(result).toBe(validData)
	})

	it('throws exception when read called before hasInput', async () => {
		const processor = new StdinInputProcessor()

		await expect(processor.read()).rejects
			.toThrow('invalid state; `hasInput` was not called or returned false')
	})
})

describe('simple input processor builder functions', () => {
	it('inputBuilder defaults to common input', () => {
		const hasInputMock = jest.fn()
		const readMock = jest.fn()

		const result = inputProcessor(hasInputMock, readMock)

		expect(result.hasInput).toBe(hasInputMock)
		expect(result.read).toBe(readMock)
		expect(result.ioFormat).toBe('common')
	})

	it('inputBuilder uses specified ioFormat', () => {
		const hasInputMock = jest.fn()
		const readMock = jest.fn()

		const result = inputProcessor(hasInputMock, readMock, 'json')

		expect(result.hasInput).toBe(hasInputMock)
		expect(result.read).toBe(readMock)
		expect(result.ioFormat).toBe('json')
	})

	it('commandLineInputProcessor uses proper methods from command', async () => {
		const hasInputMock = jest.fn()
		const readMock = jest.fn()
		const command: CommandLineInputCommand<string> = {
			hasCommandLineInput: hasInputMock,
			getInputFromCommandLine: readMock,
		}

		const inputProcessor = commandLineInputProcessor(command)

		expect(inputProcessor.ioFormat).toBe('common')

		hasInputMock.mockReturnValue(true)
		expect(inputProcessor.hasInput()).toBeTrue()
		expect(hasInputMock).toHaveBeenCalledTimes(1)

		readMock.mockResolvedValue('happy return value')
		expect(await inputProcessor.read()).toBe('happy return value')
		expect(readMock).toHaveBeenCalledTimes(1)
	})

	it('userInputProcessor uses proper methods from command', async () => {
		const readMock = jest.fn()
		const command: UserInputCommand<string> = {
			getInputFromUser: readMock,
		}

		const inputProcessor = userInputProcessor(command)

		expect(inputProcessor.ioFormat).toBe('common')

		expect(inputProcessor.hasInput()).toBeTrue()

		readMock.mockResolvedValue('happy return value')
		expect(await inputProcessor.read()).toBe('happy return value')
		expect(readMock).toHaveBeenCalledTimes(1)
	})
})

describe('CombinedInputProcessor', () => {
	function makeProcessor(hasInputMock: () => boolean | Promise<boolean>, readMock?: () => Promise<SimpleType>): InputProcessor<SimpleType> {
		return {
			ioFormat: 'common',
			hasInput: hasInputMock,
			read: readMock ? readMock : () => { throw Error('should not be called') },
		}
	}

	it('calls hasInput only as necessary', async () =>  {
		const hasInputMock1 = jest.fn()
		const hasInputMock2 = jest.fn()
		const hasInputMock3 = jest.fn()

		const processor = new CombinedInputProcessor(makeProcessor(hasInputMock1),
			makeProcessor(hasInputMock2), makeProcessor(hasInputMock3))

		hasInputMock1.mockReturnValue(false)
		hasInputMock2.mockReturnValue(false)
		hasInputMock3.mockReturnValue(true)

		expect(await processor.hasInput()).toBe(true)

		expect(hasInputMock1).toHaveBeenCalledTimes(1)
		expect(hasInputMock2).toHaveBeenCalledTimes(1)
		expect(hasInputMock3).toHaveBeenCalledTimes(1)

		jest.clearAllMocks()

		hasInputMock3.mockReturnValue(false)
		expect(await processor.hasInput()).toBe(false)

		expect(hasInputMock1).toHaveBeenCalledTimes(1)
		expect(hasInputMock2).toHaveBeenCalledTimes(1)
		expect(hasInputMock3).toHaveBeenCalledTimes(1)

		jest.clearAllMocks()

		hasInputMock1.mockReturnValue(false)
		hasInputMock2.mockReturnValue(true)

		expect(await processor.hasInput()).toBe(true)

		expect(hasInputMock1).toHaveBeenCalledTimes(1)
		expect(hasInputMock2).toHaveBeenCalledTimes(1)
		expect(hasInputMock3).toHaveBeenCalledTimes(0)

		jest.clearAllMocks()

		hasInputMock1.mockReturnValue(true)

		expect(await processor.hasInput()).toBe(true)

		expect(hasInputMock1).toHaveBeenCalledTimes(1)
		expect(hasInputMock2).toHaveBeenCalledTimes(0)
		expect(hasInputMock3).toHaveBeenCalledTimes(0)
	})

	it('calls hasInput in correct order', async () =>  {
		const hasInputMock1 = jest.fn().mockReturnValueOnce(false)
		const hasInputMock2 = jest.fn().mockResolvedValueOnce(false)
		const hasInputMock3 = jest.fn().mockResolvedValueOnce(true)

		const processor = new CombinedInputProcessor(makeProcessor(hasInputMock1),
			makeProcessor(hasInputMock2), makeProcessor(hasInputMock3))

		expect(await processor.hasInput()).toBe(true)

		expect(hasInputMock1).toHaveBeenCalledTimes(1)
		expect(hasInputMock2).toHaveBeenCalledTimes(1)
		expect(hasInputMock3).toHaveBeenCalledTimes(1)
	})

	it('works with both sync and async hasInput', async () => {
		const hasInputMock1 = jest.fn().mockReturnValueOnce(false)
		const hasInputMock2 = jest.fn().mockResolvedValueOnce(false)
		const hasInputMock3 = jest.fn().mockResolvedValueOnce(true)

		const processor = new CombinedInputProcessor(makeProcessor(hasInputMock1),
			makeProcessor(hasInputMock2), makeProcessor(hasInputMock3))

		expect(await processor.hasInput()).toBe(true)

		expect(hasInputMock1).toHaveBeenCalledTimes(1)
		expect(hasInputMock2).toHaveBeenCalledTimes(1)
		expect(hasInputMock3).toHaveBeenCalledTimes(1)
	})

	it('throws exception if ioFormat called before read', () => {
		const hasInputMock = jest.fn()
		const processor = new CombinedInputProcessor(makeProcessor(hasInputMock))

		expect(() => processor.ioFormat).toThrow('ioFormat called before read')
	})

	it('calls read only as necessary', async () =>  {
		const hasInputMock1 = jest.fn()
		const hasInputMock2 = jest.fn()
		const readMock1 = jest.fn()
		const readMock2 = jest.fn()

		const processor = new CombinedInputProcessor(makeProcessor(hasInputMock1, readMock1),
			makeProcessor(hasInputMock2, readMock2))

		hasInputMock1.mockReturnValue(true)
		readMock1.mockReturnValue(validData)

		expect(await processor.hasInput()).toBe(true)

		expect(hasInputMock1).toHaveBeenCalledTimes(1)
		expect(hasInputMock2).toHaveBeenCalledTimes(0)

		expect(await processor.read()).toEqual(validData)

		expect(readMock1).toHaveBeenCalledTimes(1)
		expect(readMock2).toHaveBeenCalledTimes(0)
	})

	it('calls read only on correct processor', async () =>  {
		const hasInputMock1 = jest.fn()
		const hasInputMock2 = jest.fn()
		const hasInputMock3 = jest.fn()
		const readMock1 = jest.fn()
		const readMock2 = jest.fn()
		const readMock3 = jest.fn()

		const processor = new CombinedInputProcessor(makeProcessor(hasInputMock1, readMock1),
			makeProcessor(hasInputMock2, readMock2), makeProcessor(hasInputMock3, readMock3))
		hasInputMock1.mockReturnValue(false)
		hasInputMock2.mockReturnValue(true)
		readMock2.mockReturnValue(validData)

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
		const hasInputMock1 = jest.fn()
		const hasInputMock2 = jest.fn()
		const hasInputMock3 = jest.fn()
		const readMock1 = jest.fn()
		const readMock2 = jest.fn()
		const readMock3 = jest.fn()

		const processor1 = { ...makeProcessor(hasInputMock1, readMock1), ioFormat: 'json' }
		const processor2 = { ...makeProcessor(hasInputMock2, readMock2), ioFormat: 'yaml' }
		const processor3 = { ...makeProcessor(hasInputMock3, readMock3), ioFormat: 'common' }
		const processor = new CombinedInputProcessor(processor1, processor2, processor3)
		hasInputMock1.mockReturnValue(false)
		hasInputMock2.mockReturnValue(true)
		readMock2.mockReturnValue(validData)

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
		const hasInputMock = jest.fn()
		const readMock = jest.fn()

		const processor = new CombinedInputProcessor(makeProcessor(hasInputMock, readMock))
		hasInputMock.mockReturnValue(false)

		expect(await processor.hasInput()).toBe(false)

		expect(hasInputMock).toHaveBeenCalledTimes(1)

		await expect(processor.read()).rejects.toThrow(ReferenceError('read called when hasInput returns false'))

		expect(readMock).toHaveBeenCalledTimes(0)
	})
})
