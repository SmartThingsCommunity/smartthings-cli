import { jest } from '@jest/globals'

import type { confirm, input } from '@inquirer/prompts'

import type { ValidateFunction } from '../../lib/user-query.js'
import type { DefaultValueFunction } from '../../lib/item-input/defs.js'


const confirmMock = jest.fn<typeof confirm>()
const inputMock = jest.fn<typeof input>().mockResolvedValue('')
jest.unstable_mockModule('@inquirer/prompts', () => ({
	confirm: confirmMock,
	input: inputMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })


const {
	booleanInput,
	displayNoneForEmpty,
	integerInput,
	optionalIntegerInput,
	optionalNumberInput,
	optionalStringInput,
	stringInput,
} = await import('../../lib/user-query.js')



describe('displayNoneForEmpty', () => {
	it.each(['', 'input value', '7'])('returns input value %s unchanged when not final', value => {
		expect(displayNoneForEmpty(value, { isFinal: false })).toBe(value)
	})

	it.each(['input value', '7'])('returns input value %s unchanged when final', value => {
		expect(displayNoneForEmpty(value, { isFinal: true })).toBe(value)
	})

	it('returns "none" when isFinal and input value is empty', () => {
		expect(displayNoneForEmpty('', { isFinal: true })).toBe('none')
	})
})

describe('optionalStringInput', () => {
	it('asks user correct question', async () => {
		inputMock.mockResolvedValueOnce('entered value')

		expect(await optionalStringInput('prompt message')).toBe('entered value')

		expect(inputMock).toHaveBeenCalledExactlyOnceWith({
			message: 'prompt message',
			required: false,
		})
	})

	it('returns nothing entered as undefined', async () => {
		expect(await optionalStringInput('prompt message')).toBe(undefined)

		expect(inputMock).toHaveBeenCalledTimes(1)
	})

	it('passes validate to inquirer', async () => {
		const validateMock = jest.fn<ValidateFunction<string>>().mockReturnValueOnce(true)

		expect(await optionalStringInput('prompt message', { validate: validateMock })).toBe(undefined)

		expect(inputMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ validate: expect.any(Function) }))

		const generatedValidate = (inputMock.mock.calls[0][0] as { validate: ValidateFunction<string> }).validate
		expect(generatedValidate('input string')).toBe(true)
		expect(validateMock).toHaveBeenCalledExactlyOnceWith('input string')
	})

	it('does not include validate when there is none', async () => {
		expect(await optionalStringInput('prompt message', { validate: undefined })).toBe(undefined)

		expect(inputMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ validate: undefined }))
	})

	it('passes default to inquirer', async () => {
		expect(await optionalStringInput('prompt message', { default: 'default value' })).toBe(undefined)

		expect(inputMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ default: 'default value' }))
	})

	it('calls default function to get default', async () => {
		const defaultMock = jest.fn<DefaultValueFunction<string>>()
			.mockReturnValueOnce('calculated default')
		inputMock.mockResolvedValueOnce('entered value')

		expect(await optionalStringInput('prompt message', { default: defaultMock })).toBe('entered value')

		expect(inputMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ default: 'calculated default' }))
		expect(defaultMock).toHaveBeenCalledExactlyOnceWith()
	})

	it('displays help text when "?" entered', async () => {
		inputMock.mockResolvedValueOnce('?')
		inputMock.mockResolvedValueOnce('entered value')

		expect(await optionalStringInput('prompt message', { helpText: 'help text' })).toBe('entered value')

		expect(inputMock).toHaveBeenCalledWith(expect.objectContaining({ message: 'prompt message (? for help)' }))
		expect(consoleLogSpy).toHaveBeenLastCalledWith('help text')
	})

	it('allows "?" even with custom validate function', async () => {
		const validateMock = jest.fn<ValidateFunction<string>>().mockReturnValue(true)
		inputMock.mockResolvedValueOnce('?')
		inputMock.mockResolvedValueOnce('entered value')

		expect(await optionalStringInput(
			'prompt message',
			{ helpText: 'help text', validate: validateMock },
		)).toBe('entered value')

		expect(inputMock).toHaveBeenCalledWith(expect.objectContaining({
			message: 'prompt message (? for help)',
			validate: expect.any(Function),
		}))
		expect(consoleLogSpy).toHaveBeenLastCalledWith('help text')

		const generatedValidate = (inputMock.mock.calls[0][0] as { validate: ValidateFunction<string> }).validate
		expect(generatedValidate('?')).toBeTrue()
		expect(validateMock).toHaveBeenCalledTimes(0)

		validateMock.mockReturnValueOnce('please enter better input')
		expect(generatedValidate('bad input')).toBe('please enter better input')
		expect(validateMock).toHaveBeenCalledExactlyOnceWith('bad input')
	})
})

describe('stringInput', () => {
	it('requires input', async () => {
		inputMock.mockResolvedValueOnce('entered value')

		expect(await stringInput('prompt message')).toBe('entered value')

		expect(inputMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ required: true }))
	})

	it('incorporates supplied validation', async () => {
		inputMock.mockResolvedValueOnce('entered value')

		const validateMock = jest.fn<ValidateFunction<string>>()

		expect(await stringInput('prompt message', { validate: validateMock }))
			.toBe('entered value')

		expect(inputMock).toHaveBeenCalledExactlyOnceWith({
			message: 'prompt message',
			required: true,
			validate: expect.any(Function),
		})

		const validateFunction = (inputMock.mock.calls[0][0] as { validate: ValidateFunction<string> }).validate

		validateMock.mockReturnValue(true)

		expect(validateFunction('a')).toBe(true)
		expect(validateMock).toHaveBeenCalledExactlyOnceWith('a')
	})
})

describe('optionalIntegerInput', () => {
	const getValidateFunction = async (): Promise<ValidateFunction<string>> => {
		await optionalIntegerInput('prompt message')
		return (inputMock.mock.calls[0][0] as { validate: ValidateFunction<string> }).validate
	}

	it('asks user correct question', async () => {
		inputMock.mockResolvedValueOnce('5')

		expect(await optionalIntegerInput('prompt message')).toBe(5)

		expect(inputMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ message: 'prompt message' }))
	})

	it('returns nothing entered as undefined', async () => {
		expect(await optionalIntegerInput('prompt message')).toBe(undefined)

		expect(inputMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ required: false }))

		expect(inputMock).toHaveBeenCalledTimes(1)
	})

	it('returns "0" entered as 0', async () => {
		inputMock.mockResolvedValueOnce('0')

		expect(await optionalIntegerInput('prompt message')).toBe(0)

		expect(inputMock).toHaveBeenCalledTimes(1)
	})

	it('passes validate to inquirer', async () => {
		const validateMock = jest.fn<ValidateFunction<number | undefined>>().mockReturnValueOnce(true)

		expect(await optionalIntegerInput('prompt message', { validate: validateMock })).toBe(undefined)

		expect(inputMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			validate: expect.any(Function),
		}))

		const generatedValidate = (inputMock.mock.calls[0][0] as { validate: ValidateFunction<string> }).validate
		expect(generatedValidate('13')).toBe(true)
		expect(validateMock).toHaveBeenCalledExactlyOnceWith(13)
	})

	it('reports an empty string as valid', async () => {
		const generatedValidate = await getValidateFunction()
		expect(generatedValidate('')).toBe(true)
	})

	it.each(['0', '7', '21553992'])(
		'reports %s as valid',
		async value => {
			const generatedValidate = await getValidateFunction()
			expect(generatedValidate(value)).toBe(true)
		},
	)

	it.each(['-5.5', 'abc', 'PI', '0.3', '3.0', 'twelve', '1/3', '7i + 3'])('reports %s as invalid', async value => {
		const generatedValidate = await getValidateFunction()
		expect(generatedValidate(value)).toBe(`"${value}" is not a valid integer`)
	})

	it('passes default to inquirer', async () => {
		inputMock.mockResolvedValueOnce('5')

		expect(await optionalIntegerInput('prompt message', { default: 5 })).toBe(5)

		expect(inputMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			default: '5',
		}))
	})

	it('calls default function to get default', async () => {
		inputMock.mockResolvedValueOnce('72')
		const defaultMock = jest.fn<DefaultValueFunction<number>>().mockReturnValueOnce(27)

		expect(await optionalIntegerInput('prompt message', { default: defaultMock })).toBe(72)

		expect(inputMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			default: '27',
		}))
		expect(defaultMock).toHaveBeenCalledExactlyOnceWith()
	})

	it('displays help text when "?" entered', async () => {
		inputMock.mockResolvedValueOnce('?')
		inputMock.mockResolvedValueOnce('13')

		expect(await optionalIntegerInput('prompt message', { helpText: 'help text' })).toBe(13)

		expect(inputMock).toHaveBeenCalledWith(expect.objectContaining({
			message: 'prompt message (? for help)',
		}))
		expect(consoleLogSpy).toHaveBeenLastCalledWith('help text')
	})

	it('allows "?" even with custom validate function', async () => {
		const validateMock = jest.fn<ValidateFunction<number | undefined>>().mockReturnValue(true)
		inputMock.mockResolvedValueOnce('?')
		inputMock.mockResolvedValueOnce('32')

		expect(await optionalIntegerInput(
			'prompt message',
			{ helpText: 'help text', validate: validateMock },
		)).toBe(32)

		expect(inputMock).toHaveBeenCalledWith(expect.objectContaining({
			message: 'prompt message (? for help)',
			validate: expect.any(Function),
		}))
		expect(consoleLogSpy).toHaveBeenLastCalledWith('help text')

		const generatedValidate = (inputMock.mock.calls[0][0] as { validate: ValidateFunction<string> }).validate
		expect(generatedValidate('?')).toBeTrue()
		expect(validateMock).toHaveBeenCalledTimes(0)
	})
})

describe('integerInput', () => {
	it('requires input', async () => {
		inputMock.mockResolvedValueOnce('43')

		expect(await integerInput('prompt message')).toBe(43)

		expect(inputMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ required: true }))
	})

	it('incorporates supplied validation', async () => {
		inputMock.mockResolvedValueOnce('7')

		const validateMock = jest.fn<ValidateFunction<number | undefined>>()

		expect(await integerInput('prompt message', { validate: validateMock })).toBe(7)

		expect(inputMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			validate: expect.any(Function),
		}))

		const generatedValidate = (inputMock.mock.calls[0][0] as { validate: ValidateFunction<string> }).validate

		validateMock.mockReturnValue(true)

		expect(generatedValidate('77')).toBe(true)
		expect(validateMock).toHaveBeenCalledExactlyOnceWith(77)
	})
})

describe('optionalNumberInput', () => {
	const getValidateFunction = async (): Promise<ValidateFunction<string>> => {
		await optionalNumberInput('prompt message')
		return (inputMock.mock.calls[0][0] as { validate: ValidateFunction<string> }).validate
	}

	it('asks user correct question', async () => {
		inputMock.mockResolvedValueOnce('5')

		expect(await optionalNumberInput('prompt message')).toBe(5)

		expect(inputMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ message: 'prompt message' }))
	})

	it('returns nothing entered as undefined', async () => {
		expect(await optionalNumberInput('prompt message')).toBe(undefined)

		expect(inputMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ required: false }))

		expect(inputMock).toHaveBeenCalledTimes(1)
	})

	it('returns "0" entered as 0', async () => {
		inputMock.mockResolvedValueOnce('0')

		expect(await optionalNumberInput('prompt message')).toBe(0)

		expect(inputMock).toHaveBeenCalledTimes(1)
	})

	it('passes validate to inquirer', async () => {
		const validateMock = jest.fn<ValidateFunction<number | undefined>>().mockReturnValueOnce(true)

		expect(await optionalNumberInput('prompt message', { validate: validateMock })).toBe(undefined)

		expect(inputMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			validate: expect.any(Function),
		}))

		const generatedValidate = (inputMock.mock.calls[0][0] as { validate: ValidateFunction<string> }).validate
		expect(generatedValidate('13')).toBe(true)
		expect(validateMock).toHaveBeenCalledExactlyOnceWith(13)
	})

	it('reports an empty string as valid', async () => {
		const generatedValidate = await getValidateFunction()
		expect(generatedValidate('')).toBe(true)
	})

	it.each(['-5.5', '0', '0.3', '3.0', '7', '21553992'])(
		'reports %s as valid',
		async value => {
			const generatedValidate = await getValidateFunction()
			expect(generatedValidate(value)).toBe(true)
		},
	)

	it.each(['abc', 'PI', 'twelve', '1/3', '7i + 3'])('reports %s as invalid', async value => {
		const generatedValidate = await getValidateFunction()
		expect(generatedValidate(value)).toBe(`"${value}" is not a valid number`)
	})

	it('passes default to inquirer', async () => {
		inputMock.mockResolvedValueOnce('5')

		expect(await optionalNumberInput('prompt message', { default: 5.7 })).toBe(5)

		expect(inputMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			default: '5.7',
		}))
	})

	it('calls default function to get default', async () => {
		inputMock.mockResolvedValueOnce('72.7')
		const defaultMock = jest.fn<DefaultValueFunction<number>>().mockReturnValueOnce(27.3)

		expect(await optionalNumberInput('prompt message', { default: defaultMock })).toBe(72.7)

		expect(inputMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			default: '27.3',
		}))
		expect(defaultMock).toHaveBeenCalledExactlyOnceWith()
	})

	it('displays help text when "?" entered', async () => {
		inputMock.mockResolvedValueOnce('?')
		inputMock.mockResolvedValueOnce('13')

		expect(await optionalNumberInput('prompt message', { helpText: 'help text' })).toBe(13)

		expect(inputMock).toHaveBeenCalledWith(expect.objectContaining({
			message: 'prompt message (? for help)',
		}))
		expect(consoleLogSpy).toHaveBeenLastCalledWith('help text')
	})

	it('allows "?" even with custom validate function', async () => {
		const validateMock = jest.fn<ValidateFunction<number | undefined>>().mockReturnValue(true)
		inputMock.mockResolvedValueOnce('?')
		inputMock.mockResolvedValueOnce('32')

		expect(await optionalNumberInput(
			'prompt message',
			{ helpText: 'help text', validate: validateMock },
		)).toBe(32)

		expect(inputMock).toHaveBeenCalledWith(expect.objectContaining({
			message: 'prompt message (? for help)',
			validate: expect.any(Function),
		}))
		expect(consoleLogSpy).toHaveBeenLastCalledWith('help text')

		const generatedValidate = (inputMock.mock.calls[0][0] as { validate: ValidateFunction<string> }).validate
		expect(generatedValidate('?')).toBeTrue()
		expect(validateMock).toHaveBeenCalledTimes(0)
	})
})

describe('booleanInput', () => {
	it('defaults to true', async () => {
		confirmMock.mockResolvedValueOnce(false)

		expect(await booleanInput('Are you absolutely certain?')).toBe(false)

		expect(confirmMock).toHaveBeenCalledExactlyOnceWith({
			message: 'Are you absolutely certain?',
			default: true,
		})
	})

	it('accepts alternate default', async () => {
		confirmMock.mockResolvedValueOnce(true)

		expect(await booleanInput('Are you absolutely certain?', { default: false })).toBe(true)

		expect(confirmMock).toHaveBeenCalledExactlyOnceWith({
			message: 'Are you absolutely certain?',
			default: false,
		})
	})
})
