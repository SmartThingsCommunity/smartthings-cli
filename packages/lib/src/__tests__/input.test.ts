import { CombinedInputProcessor, FileInputProcessor, InputProcessor, StdinInputProcessor, UserInputProcessor } from '../input'
import { IOFormat } from '../io-util'
import * as ioUtil from '../io-util'
import { SimpleType, validData } from './io-util.test'


const resourcesDir = './src/__tests__/resources'

beforeEach(() => {
	jest.mock('../io-util')
})

afterEach(() => {
	jest.restoreAllMocks()
})

describe('FileInputProcessor', () => {
	it('gets format from filename', () => {
		const formatFromFilenameSpy = jest.spyOn(ioUtil, 'formatFromFilename').mockReturnValue(IOFormat.JSON)
		expect(new FileInputProcessor('fn').ioFormat).toBe(IOFormat.JSON)
		expect(formatFromFilenameSpy).toHaveBeenCalledWith('fn')
	})

	it('hasInput returns false for no filename', () =>  {
		const processor = new FileInputProcessor()
		expect(processor.hasInput()).toBe(false)
	})

	it('throws exception on read with no filename', () =>  {
		const processor = new FileInputProcessor()
		expect(processor.hasInput()).toBe(false)
		expect(processor.read()).rejects.toEqual(ReferenceError('read called when hasInput returns false'))
	})

	it('returns data as expected', async () =>  {
		const processor = new FileInputProcessor(`${resourcesDir}/simple_type.yaml`)
		expect(processor.hasInput()).toBe(true)
		expect(await processor.read()).toEqual(validData)
	})
})

describe('StdinInputProcessor', () => {
	it('specifies JSON format', () =>  {
		expect(new StdinInputProcessor().ioFormat).toBe(IOFormat.JSON)
	})

	it('hasInput returns false for TTY input', () =>  {
		const isTTYSpy = jest.spyOn(ioUtil, 'stdinIsTTY').mockReturnValue(true)
		const processor = new StdinInputProcessor()
		expect(processor.hasInput()).toBe(false)
		expect(isTTYSpy).toHaveBeenCalledTimes(1)
	})

	it('processes valid YAML into object', async () =>  {
		const processor = new StdinInputProcessor()

		const isTTYSpy = jest.spyOn(ioUtil, 'stdinIsTTY').mockReturnValue(false)
		expect(processor.hasInput()).toBe(true)
		expect(isTTYSpy).toHaveBeenCalledTimes(1)

		const readDataFromStdinSpy = jest.spyOn(ioUtil, 'readDataFromStdin').mockResolvedValue('some yaml')
		const parseJSONOrYAMLSpy = jest.spyOn(ioUtil, 'parseJSONOrYAML').mockReturnValue(validData)

		const result = await processor.read()

		expect(readDataFromStdinSpy).toHaveBeenCalledTimes(1)
		expect(parseJSONOrYAMLSpy).toHaveBeenCalledWith('some yaml', 'stdin')
		expect(result).toBe(validData)
	})
})

describe('UserInputProcessor', () => {
	class MyUserInputProcessor extends UserInputProcessor<SimpleType> {
		hasInput(): boolean {
			throw Error('Method not implemented.')
		}
		read(): Promise<SimpleType> {
			throw Error('Method not implemented.')
		}
	}

	it('specifies JSON format', () =>  {
		expect(new MyUserInputProcessor().ioFormat).toBe(IOFormat.COMMON)
	})
})

describe('CombinedInputProcessor', () => {
	function makeProcessor(hasInputSpy: () => boolean, readSpy?: () => Promise<SimpleType>): InputProcessor<SimpleType> {
		return {
			ioFormat: IOFormat.COMMON,
			hasInput: hasInputSpy,
			read: readSpy ? readSpy : () => { throw Error('should not be called') },
		}
	}

	it('calls hasInput only as necessary', () =>  {
		const hasInputSpy1 = jest.fn()
		const hasInputSpy2 = jest.fn()
		const hasInputSpy3 = jest.fn()

		const processor = new CombinedInputProcessor(makeProcessor(hasInputSpy1),
			makeProcessor(hasInputSpy2), makeProcessor(hasInputSpy3))

		hasInputSpy1.mockReturnValue(false)
		hasInputSpy2.mockReturnValue(false)
		hasInputSpy3.mockReturnValue(true)

		expect(processor.hasInput()).toBe(true)

		expect(hasInputSpy1).toHaveBeenCalledTimes(1)
		expect(hasInputSpy2).toHaveBeenCalledTimes(1)
		expect(hasInputSpy3).toHaveBeenCalledTimes(1)

		jest.clearAllMocks()

		hasInputSpy3.mockReturnValue(false)
		expect(processor.hasInput()).toBe(false)

		expect(hasInputSpy1).toHaveBeenCalledTimes(1)
		expect(hasInputSpy2).toHaveBeenCalledTimes(1)
		expect(hasInputSpy3).toHaveBeenCalledTimes(1)

		jest.clearAllMocks()

		hasInputSpy1.mockReturnValue(false)
		hasInputSpy2.mockReturnValue(true)

		expect(processor.hasInput()).toBe(true)

		expect(hasInputSpy1).toHaveBeenCalledTimes(1)
		expect(hasInputSpy2).toHaveBeenCalledTimes(1)
		expect(hasInputSpy3).toHaveBeenCalledTimes(0)

		jest.clearAllMocks()

		hasInputSpy1.mockReturnValue(true)

		expect(processor.hasInput()).toBe(true)

		expect(hasInputSpy1).toHaveBeenCalledTimes(1)
		expect(hasInputSpy2).toHaveBeenCalledTimes(0)
		expect(hasInputSpy3).toHaveBeenCalledTimes(0)
	})

	it('calls hasInput in correct order', () =>  {
		const hasInputSpy1 = jest.fn()
		const hasInputSpy2 = jest.fn()
		const hasInputSpy3 = jest.fn()

		const processor = new CombinedInputProcessor(makeProcessor(hasInputSpy1),
			makeProcessor(hasInputSpy2), makeProcessor(hasInputSpy3))
		const called: Array<number> = []

		hasInputSpy1.mockImplementation(() => {
			called.push(1)
			return false
		})
		hasInputSpy2.mockImplementation(() => {
			called.push(2)
			return false
		})
		hasInputSpy3.mockImplementation(() => {
			called.push(3)
			return true
		})

		expect(processor.hasInput()).toBe(true)
		expect(called).toEqual([1, 2, 3])
	})

	it('throws exception if ioFormat called before read', () => {
		const hasInputSpy1 = jest.fn()
		const processor = new CombinedInputProcessor(makeProcessor(hasInputSpy1))

		expect(() => processor.ioFormat).toThrow('ioFormat called before read')
	})

	it('calls read only as necessary', async () =>  {
		const hasInputSpy1 = jest.fn()
		const hasInputSpy2 = jest.fn()
		const readSpy1 = jest.fn()
		const readSpy2 = jest.fn()

		const processor = new CombinedInputProcessor(makeProcessor(hasInputSpy1, readSpy1),
			makeProcessor(hasInputSpy2, readSpy2))

		hasInputSpy1.mockReturnValue(true)
		readSpy1.mockReturnValue(validData)

		expect(processor.hasInput()).toBe(true)

		expect(hasInputSpy1).toHaveBeenCalledTimes(1)
		expect(hasInputSpy2).toHaveBeenCalledTimes(0)

		expect(await processor.read()).toEqual(validData)

		expect(readSpy1).toHaveBeenCalledTimes(1)
		expect(readSpy2).toHaveBeenCalledTimes(0)
	})

	it('calls read only on correct processor', async () =>  {
		const hasInputSpy1 = jest.fn()
		const hasInputSpy2 = jest.fn()
		const hasInputSpy3 = jest.fn()
		const readSpy1 = jest.fn()
		const readSpy2 = jest.fn()
		const readSpy3 = jest.fn()

		const processor = new CombinedInputProcessor(makeProcessor(hasInputSpy1, readSpy1),
			makeProcessor(hasInputSpy2, readSpy2), makeProcessor(hasInputSpy3, readSpy3))
		hasInputSpy1.mockReturnValue(false)
		hasInputSpy2.mockReturnValue(true)
		readSpy2.mockReturnValue(validData)

		expect(processor.hasInput()).toBe(true)

		expect(hasInputSpy1).toHaveBeenCalledTimes(1)
		expect(hasInputSpy2).toHaveBeenCalledTimes(1)
		expect(hasInputSpy3).toHaveBeenCalledTimes(0)

		expect(await processor.read()).toEqual(validData)

		expect(readSpy1).toHaveBeenCalledTimes(0)
		expect(readSpy2).toHaveBeenCalledTimes(1)
		expect(readSpy3).toHaveBeenCalledTimes(0)
	})

	it('gets ioFormat from correct processor', async () =>  {
		const hasInputSpy1 = jest.fn()
		const hasInputSpy2 = jest.fn()
		const hasInputSpy3 = jest.fn()
		const readSpy1 = jest.fn()
		const readSpy2 = jest.fn()
		const readSpy3 = jest.fn()

		const processor1 = { ...makeProcessor(hasInputSpy1, readSpy1), ioFormat: IOFormat.JSON }
		const processor2 = { ...makeProcessor(hasInputSpy2, readSpy2), ioFormat: IOFormat.YAML }
		const processor3 = { ...makeProcessor(hasInputSpy3, readSpy3), ioFormat: IOFormat.COMMON }
		const processor = new CombinedInputProcessor(processor1, processor2, processor3)
		hasInputSpy1.mockReturnValue(false)
		hasInputSpy2.mockReturnValue(true)
		readSpy2.mockReturnValue(validData)

		expect(processor.hasInput()).toBe(true)

		expect(hasInputSpy1).toHaveBeenCalledTimes(1)
		expect(hasInputSpy2).toHaveBeenCalledTimes(1)
		expect(hasInputSpy3).toHaveBeenCalledTimes(0)

		expect(await processor.read()).toEqual(validData)

		expect(readSpy1).toHaveBeenCalledTimes(0)
		expect(readSpy2).toHaveBeenCalledTimes(1)
		expect(readSpy3).toHaveBeenCalledTimes(0)

		expect(processor.ioFormat).toBe(IOFormat.YAML)
	})

	it('throws exception on read with no filename', async () =>  {
		const hasInputSpy = jest.fn()
		const readSpy = jest.fn()

		const processor = new CombinedInputProcessor(makeProcessor(hasInputSpy, readSpy))
		hasInputSpy.mockReturnValue(false)

		expect(processor.hasInput()).toBe(false)

		expect(hasInputSpy).toHaveBeenCalledTimes(1)

		expect(processor.read()).rejects.toThrow(ReferenceError('read called when hasInput returns false'))

		expect(readSpy).toHaveBeenCalledTimes(0)
	})
})
