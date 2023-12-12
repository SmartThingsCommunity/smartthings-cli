import { jest } from '@jest/globals'

import { combinedInputProcessor, fileInputProcessor, InputProcessor, stdinInputProcessor }
	from '../../../lib/command/input-processor.js'
import { SimpleType } from '../../test-lib/simple-type.js'


const combinedInputProcessorMock: jest.Mock<typeof combinedInputProcessor> = jest.fn()
const fileInputProcessorMock: jest.Mock<typeof fileInputProcessor> = jest.fn()
const stdinInputProcessorMock: jest.Mock<typeof stdinInputProcessor> = jest.fn()
jest.unstable_mockModule('../../../lib/command/input-processor.js', () => ({
	combinedInputProcessor: combinedInputProcessorMock,
	fileInputProcessor: fileInputProcessorMock,
	stdinInputProcessor: stdinInputProcessorMock,
}))


const { buildInputProcessor } = await import('../../../lib/command/input-builder.js')


describe('buildInputProcessor', () => {
	it('includes file and stdin input processors', () => {
		const flags = {}

		buildInputProcessor<SimpleType>(flags)

		expect(fileInputProcessorMock).toHaveBeenCalledTimes(1)
		expect(stdinInputProcessorMock).toHaveBeenCalledTimes(1)
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

		const inputProcessor = makeProcessor()
		fileInputProcessorMock.mockReturnValue(inputProcessor as InputProcessor<SimpleType>)
		const stdinInputProcessor = makeProcessor()
		stdinInputProcessorMock.mockReturnValue(stdinInputProcessor as InputProcessor<SimpleType>)
		const userProcessor1 = makeProcessor()
		const userProcessor2 = makeProcessor()

		buildInputProcessor<SimpleType>(flags, userProcessor1, userProcessor2)

		expect(fileInputProcessorMock).toHaveBeenCalledTimes(1)
		expect(fileInputProcessorMock).toHaveBeenCalledWith('fn')
		expect(stdinInputProcessorMock).toHaveBeenCalledTimes(1)
		expect(combinedInputProcessorMock).toHaveBeenCalledTimes(1)
		expect(combinedInputProcessorMock).toHaveBeenCalledWith(inputProcessor, stdinInputProcessor, userProcessor1, userProcessor2)
	})
})
