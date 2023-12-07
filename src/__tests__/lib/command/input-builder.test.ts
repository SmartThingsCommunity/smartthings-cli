import { CombinedInputProcessor, FileInputProcessor, InputProcessor, StdinInputProcessor }
	from '../../../lib/command/input-processor.js'
import { buildInputProcessor } from '../../../lib/command/input-builder.js'
import { SimpleType } from '../../test-lib/simple-type.js'


jest.mock('../../../lib/command/input-processor.js')


describe('buildInputProcessor', () => {
	it('includes file and stdin input processors', () => {
		const fileInputProcessorSpy = jest.mocked(FileInputProcessor)
		const stdinInputProcessorSpy = jest.mocked(StdinInputProcessor)

		const flags = {}

		buildInputProcessor<SimpleType>(flags)

		expect(fileInputProcessorSpy).toHaveBeenCalledTimes(1)
		expect(stdinInputProcessorSpy).toHaveBeenCalledTimes(1)
	})

	it('includes added processors in order after file and stdin ones', () => {
		const flags = { input: 'fn' }
		function makeProcessor(): InputProcessor<SimpleType> {
			return {
				ioFormat: 'json',
				hasInput: () => false,
				read(): Promise<SimpleType> {
					throw Error('Method not implemented.')
				},
			}
		}

		const fileInputProcessor = makeProcessor()
		const fileMock = jest.mocked(FileInputProcessor)
			.mockReturnValue(fileInputProcessor as FileInputProcessor<SimpleType>)
		const stdinInputProcessor = makeProcessor()
		const stdinMock = jest.mocked(StdinInputProcessor)
			.mockReturnValue(stdinInputProcessor as StdinInputProcessor<SimpleType>)
		const userProcessor1 = makeProcessor()
		const userProcessor2 = makeProcessor()
		const mock = jest.mocked(CombinedInputProcessor)

		buildInputProcessor<SimpleType>(flags, userProcessor1, userProcessor2)

		expect(fileMock).toHaveBeenCalledTimes(1)
		expect(fileMock).toHaveBeenCalledWith('fn')
		expect(stdinMock).toHaveBeenCalledTimes(1)
		expect(mock).toHaveBeenCalledTimes(1)
		expect(mock).toHaveBeenCalledWith(fileInputProcessor, stdinInputProcessor, userProcessor1, userProcessor2)
	})
})
