import * as input from '../input.js'
import { buildInputProcessor } from '../input-builder.js'
import { IOFormat } from '../io-util.js'
import { SimpleType } from './test-lib/simple-type.js'
import { buildMockCommand } from './test-lib/mock-command.js'


jest.mock('../input')

afterEach(() => {
	jest.resetAllMocks()
})

describe('buildInputProcessor', () => {
	it('includes file and stdin input processors', () => {
		const fileInputProcessorSpy = jest.spyOn(input, 'FileInputProcessor')
		const stdinInputProcessorSpy = jest.spyOn(input, 'StdinInputProcessor')

		const command = buildMockCommand()

		buildInputProcessor<SimpleType>(command)

		expect(fileInputProcessorSpy).toHaveBeenCalledTimes(1)
		expect(stdinInputProcessorSpy).toHaveBeenCalledTimes(1)
	})

	it('includes added processors in order after file and stdin ones', () => {
		const command = {
			...buildMockCommand(),
			flags: { input: 'fn' },
		}
		function makeProcessor(): input.InputProcessor<SimpleType> {
			return {
				ioFormat: IOFormat.JSON,
				hasInput: () => false,
				read(): Promise<SimpleType> {
					throw Error('Method not implemented.')
				},
			}
		}

		const fileInputProcessor = makeProcessor()
		const fileSpy = jest.spyOn(input, 'FileInputProcessor')
			.mockReturnValue(fileInputProcessor as input.FileInputProcessor<SimpleType>)
		const stdinInputProcessor = makeProcessor()
		const stdinSpy = jest.spyOn(input, 'StdinInputProcessor')
			.mockReturnValue(stdinInputProcessor as input.StdinInputProcessor<SimpleType>)
		const userProcessor1 = makeProcessor()
		const userProcessor2 = makeProcessor()
		const spy = jest.spyOn(input, 'CombinedInputProcessor')

		buildInputProcessor<SimpleType>(command, userProcessor1, userProcessor2)

		expect(fileSpy).toHaveBeenCalledTimes(1)
		expect(fileSpy).toHaveBeenCalledWith('fn')
		expect(stdinSpy).toHaveBeenCalledTimes(1)
		expect(spy).toHaveBeenCalledTimes(1)
		expect(spy).toHaveBeenCalledWith(fileInputProcessor, stdinInputProcessor, userProcessor1, userProcessor2)
	})
})
