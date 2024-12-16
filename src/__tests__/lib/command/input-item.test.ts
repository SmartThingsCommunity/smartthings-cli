import { jest } from '@jest/globals'

import type { InputProcessor } from '../../../lib/command/input-processor.js'
import type {
	InputProcessorFlags,
	buildInputProcessor,
	inputProcessorBuilder,
} from '../../../lib/command/input-builder.js'
import type { SimpleType } from '../../test-lib/simple-type.js'
import type { IOFormat } from '../../../lib/io-util.js'
import type { fatalError } from '../../../lib/util.js'


const inputProcessorBuilderMock = jest.fn<typeof inputProcessorBuilder>()
const buildInputProcessorMock = jest.fn<typeof buildInputProcessor>()
jest.unstable_mockModule('../../../lib/command/input-builder.js', () => ({
	inputProcessorBuilder: inputProcessorBuilderMock,
	buildInputProcessor: buildInputProcessorMock,
}))

const fatalErrorMock = jest.fn<typeof fatalError>().mockReturnValue('never return' as never)
jest.unstable_mockModule('../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))


const { inputItem } = await import('../../../lib/command/input-item.js')


describe('inputItem', () => {
	const item: SimpleType = { str: 'string-1', num: 5 }

	const ioFormatMock = jest.fn<() => IOFormat>()
	const hasInputMock = jest.fn<InputProcessor<SimpleType>['hasInput']>()
	const readMock = jest.fn<InputProcessor<SimpleType>['read']>()

	const flags: InputProcessorFlags = {
		input: 'input.yaml',
	}

	const inputProcessor: InputProcessor<SimpleType> = {
		get ioFormat(): IOFormat {
			return ioFormatMock()
		},
		hasInput: hasInputMock,
		read: readMock,
	}

	it('accepts input and returns input', async () => {
		ioFormatMock.mockReturnValueOnce('common')
		hasInputMock.mockReturnValueOnce(true)
		readMock.mockResolvedValueOnce(item)

		buildInputProcessorMock.mockReturnValue(inputProcessor)

		expect(await inputItem(flags)).toEqual([item, 'common'])

		expect(buildInputProcessorMock).toHaveBeenCalledExactlyOnceWith(flags)
		expect(hasInputMock).toHaveBeenCalledTimes(1)
		expect(readMock).toHaveBeenCalledTimes(1)
		expect(ioFormatMock).toHaveBeenCalled()
		expect(hasInputMock).toHaveBeenCalledBefore(readMock)
		expect(readMock).toHaveBeenCalledBefore(ioFormatMock)
	})

	it('exists with fatal error when there is no input', async () => {
		const inputProcessor: InputProcessor<SimpleType> = {
			ioFormat: 'common',
			hasInput: () => false,
			read: async () => item,
		}

		buildInputProcessorMock.mockReturnValueOnce(inputProcessor)

		expect(await inputItem(flags)).toBe('never return')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith(
			'input is required either via file specified with --input option or from stdin',
		)
	})

	it('works with async hasInput', async () => {
		ioFormatMock.mockReturnValueOnce('common')
		hasInputMock.mockReturnValueOnce(Promise.resolve(true))
		readMock.mockResolvedValueOnce(item)

		buildInputProcessorMock.mockReturnValueOnce(inputProcessor)

		expect(await inputItem(flags)).toEqual([item, 'common'])

		expect(buildInputProcessorMock).toHaveBeenCalledExactlyOnceWith(flags)
		expect(hasInputMock).toHaveBeenCalledTimes(1)
		expect(readMock).toHaveBeenCalledTimes(1)
		expect(ioFormatMock).toHaveBeenCalled()
		expect(hasInputMock).toHaveBeenCalledBefore(readMock)
		expect(readMock).toHaveBeenCalledBefore(ioFormatMock)
	})
})
