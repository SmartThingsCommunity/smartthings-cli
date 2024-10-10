import { jest } from '@jest/globals'

import {
	ValidateFunction,
} from '../../lib/user-query.js'
import inquirer from 'inquirer'
import { DefaultValueFunction } from '../../lib/item-input/defs.js'


const promptMock = jest.fn<typeof inquirer.prompt>()
jest.unstable_mockModule('inquirer', () => ({
	default: {
		prompt: promptMock,
	},
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })


const {
	askForBoolean,
	askForInteger,
	askForNumber,
	askForOptionalInteger,
	askForString,
	askForOptionalString,
	numberTransformer,
} = await import('../../lib/user-query.js')


describe('numberTransformer', () => {
	it.each(['', 'input value', '7'])('returns input value unchanged when not final', value => {
		expect(numberTransformer(value, { value }, { isFinal: false })).toBe(value)
	})

	it.each(['input value', '7'])('returns input value unchanged when not empty', value => {
		expect(numberTransformer(value, { value }, { isFinal: true })).toBe(value)
	})

	it('returns "none" when isFinal and input value is empty', () => {
		expect(numberTransformer('', { value: '' }, { isFinal: true })).toBe('none')
	})
})

describe('askForOptionalString', () => {
	it('asks user correct question', async () => {
		promptMock.mockResolvedValue({ value: 'entered value' })

		expect(await askForOptionalString('prompt message')).toBe('entered value')

		expect(promptMock).toHaveBeenCalledExactlyOnceWith({
			type: 'input',
			name: 'value',
			message: 'prompt message',
		})
	})

	it('returns nothing entered as undefined', async () => {
		promptMock.mockResolvedValue({ value: '' })

		expect(await askForOptionalString('prompt message')).toBe(undefined)

		expect(promptMock).toHaveBeenCalledTimes(1)
	})

	it('passes validate to inquirer', async () => {
		promptMock.mockResolvedValue({ value: '' })

		const validateMock = jest.fn<ValidateFunction>().mockReturnValueOnce(true)

		expect(await askForOptionalString('prompt message', { validate: validateMock }))
			.toBe(undefined)

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			validate: expect.any(Function),
		}))

		const generatedValidate = (promptMock.mock.calls[0][0] as { validate: ValidateFunction })
			.validate
		expect(generatedValidate('input string')).toBe(true)
		expect(validateMock).toHaveBeenCalledExactlyOnceWith('input string')
	})

	it('does not include validate when there is none', async () => {
		promptMock.mockResolvedValue({ value: '' })

		expect(await askForOptionalString('prompt message', { validate: undefined }))
			.toBe(undefined)

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.not.objectContaining({
			validate: undefined,
		}))
	})

	it('does not include validate when there is none', async () => {
		promptMock.mockResolvedValue({ value: '' })

		expect(await askForOptionalString('prompt message', { validate: undefined })).toBe(undefined)

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.not.objectContaining({
			validate: undefined,
		}))
	})

	it('passes default to inquirer', async () => {
		promptMock.mockResolvedValue({ value: '' })

		expect(await askForOptionalString('prompt message', { default: 'default value' }))
			.toBe(undefined)

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			default: 'default value',
		}))
	})

	it('calls default function to get default', async () => {
		const defaultMock = jest.fn<DefaultValueFunction<string>>()
			.mockReturnValueOnce('calculated default')
		promptMock.mockResolvedValue({ value: 'entered value' })

		expect(await askForOptionalString('prompt message', { default: defaultMock }))
			.toBe('entered value')

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			default: 'calculated default',
		}))
		expect(defaultMock).toHaveBeenCalledExactlyOnceWith()
	})

	it('displays help text when "?" entered', async () => {
		promptMock.mockResolvedValueOnce({ value: '?' })
		promptMock.mockResolvedValueOnce({ value: 'entered value' })

		expect(await askForOptionalString('prompt message', { helpText: 'help text' }))
			.toBe('entered value')

		expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
			message: 'prompt message (? for help)',
		}))
		expect(consoleLogSpy).toHaveBeenLastCalledWith('help text')
	})

	it('allows "?" even with custom validate function', async () => {
		const validateMock = jest.fn<ValidateFunction>().mockReturnValue(true)
		promptMock.mockResolvedValueOnce({ value: '?' })
		promptMock.mockResolvedValueOnce({ value: 'entered value' })

		expect(await askForOptionalString(
			'prompt message',
			{ helpText: 'help text', validate: validateMock },
		)).toBe('entered value')

		expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
			message: 'prompt message (? for help)',
			validate: expect.any(Function),
		}))
		expect(consoleLogSpy).toHaveBeenLastCalledWith('help text')

		const generatedValidate = (promptMock.mock.calls[0][0] as { validate: ValidateFunction })
			.validate
		expect(generatedValidate('?')).toBeTrue()
		expect(validateMock).toHaveBeenCalledTimes(0)

		validateMock.mockReturnValueOnce('please enter better input')
		expect(generatedValidate('bad input')).toBe('please enter better input')
		expect(validateMock).toHaveBeenCalledExactlyOnceWith('bad input')
	})
})

describe('askForString', () => {
	it('requires input', async () => {
		promptMock.mockResolvedValue({ value: 'entered value' })

		expect(await askForString('prompt message')).toBe('entered value')

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			validate: expect.any(Function),
		}))

		const validateFunction = (promptMock.mock.calls[0][0] as { validate: ValidateFunction })
			.validate

		expect(validateFunction('')).toBe('value is required')
		expect(validateFunction('a')).toBe(true)
	})

	it('incorporates supplied validation', async () => {
		promptMock.mockResolvedValue({ value: 'entered value' })

		const validateMock = jest.fn<ValidateFunction>()

		expect(await askForString('prompt message', { validate: validateMock }))
			.toBe('entered value')

		expect(promptMock).toHaveBeenCalledExactlyOnceWith({
			type: 'input',
			name: 'value',
			message: 'prompt message',
			validate: expect.any(Function),
		})

		const validateFunction = (promptMock.mock.calls[0][0] as { validate: ValidateFunction })
			.validate

		validateMock.mockReturnValue(true)

		expect(validateFunction('')).toBe('value is required')
		expect(validateMock).toHaveBeenCalledTimes(0)

		expect(validateFunction('a')).toBe(true)
		expect(validateMock).toHaveBeenCalledExactlyOnceWith('a')
	})
})

describe('askForOptionalInteger', () => {
	it('asks user correct question', async () => {
		promptMock.mockResolvedValue({ value: '5' })

		expect(await askForOptionalInteger('prompt message')).toBe(5)

		expect(promptMock).toHaveBeenCalledExactlyOnceWith({
			type: 'input',
			name: 'value',
			message: 'prompt message',
			transformer: numberTransformer,
		})
	})

	it('returns nothing entered as undefined', async () => {
		promptMock.mockResolvedValue({ value: '' })

		expect(await askForOptionalInteger('prompt message')).toBe(undefined)

		expect(promptMock).toHaveBeenCalledTimes(1)
	})

	it('passes validate to inquirer', async () => {
		promptMock.mockResolvedValue({ value: '' })

		const validateMock = jest.fn<ValidateFunction>().mockReturnValueOnce(true)

		expect(await askForOptionalInteger('prompt message', { validate: validateMock }))
			.toBe(undefined)

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			validate: expect.any(Function),
		}))

		const generatedValidate = (promptMock.mock.calls[0][0] as { validate: ValidateFunction })
			.validate
		expect(generatedValidate('input string')).toBe(true)
		expect(validateMock).toHaveBeenCalledExactlyOnceWith('input string')
	})

	it('does not include validate when there is none', async () => {
		promptMock.mockResolvedValue({ value: '' })

		expect(await askForOptionalInteger('prompt message', { validate: undefined }))
			.toBe(undefined)

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.not.objectContaining({
			validate: undefined,
		}))
	})

	it('does not include validate when there is none', async () => {
		promptMock.mockResolvedValue({ value: '' })

		expect(await askForOptionalInteger('prompt message', { validate: undefined })).toBe(undefined)

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.not.objectContaining({
			validate: undefined,
		}))
	})

	it('passes default to inquirer', async () => {
		promptMock.mockResolvedValue({ value: '5' })

		expect(await askForOptionalInteger('prompt message', { default: 5 })).toBe(5)

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			default: 5,
		}))
	})

	it('calls default function to get default', async () => {
		const defaultMock = jest.fn<DefaultValueFunction<number>>().mockReturnValueOnce(27)
		promptMock.mockResolvedValue({ value: '72' })

		expect(await askForOptionalInteger('prompt message', { default: defaultMock })).toBe(72)

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			default: 27,
		}))
		expect(defaultMock).toHaveBeenCalledExactlyOnceWith()
	})

	it('displays help text when "?" entered', async () => {
		promptMock.mockResolvedValueOnce({ value: '?' })
		promptMock.mockResolvedValueOnce({ value: '13' })

		expect(await askForOptionalInteger('prompt message', { helpText: 'help text' })).toBe(13)

		expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
			message: 'prompt message (? for help)',
		}))
		expect(consoleLogSpy).toHaveBeenLastCalledWith('help text')
	})

	it('allows "?" even with custom validate function', async () => {
		const validateMock = jest.fn<ValidateFunction>().mockReturnValue(true)
		promptMock.mockResolvedValueOnce({ value: '?' })
		promptMock.mockResolvedValueOnce({ value: 32 })

		expect(await askForOptionalInteger(
			'prompt message',
			{ helpText: 'help text', validate: validateMock },
		)).toBe(32)

		expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
			message: 'prompt message (? for help)',
			validate: expect.any(Function),
		}))
		expect(consoleLogSpy).toHaveBeenLastCalledWith('help text')

		const generatedValidate = (promptMock.mock.calls[0][0] as { validate: ValidateFunction })
			.validate
		expect(generatedValidate('?')).toBeTrue()
		expect(validateMock).toHaveBeenCalledTimes(0)

		validateMock.mockReturnValueOnce('please enter better input')
		expect(generatedValidate('bad input')).toBe('please enter better input')
		expect(validateMock).toHaveBeenCalledExactlyOnceWith('bad input')
	})
})

describe('askForInteger', () => {
	it('requires input', async () => {
		promptMock.mockResolvedValue({ value: '43' })

		expect(await askForInteger('prompt message')).toBe(43)

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			validate: expect.any(Function),
		}))

		const validateFunction = (promptMock.mock.calls[0][0] as { validate: ValidateFunction })
			.validate

		expect(validateFunction('')).toBe('value is required')
		expect(validateFunction('a')).toBe(true)
	})

	it('incorporates supplied validation', async () => {
		promptMock.mockResolvedValue({ value: '7' })

		const validateMock = jest.fn<ValidateFunction>()

		expect(await askForInteger('prompt message', { validate: validateMock })).toBe(7)

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			validate: expect.any(Function),
		}))

		const validateFunction = (promptMock.mock.calls[0][0] as { validate: ValidateFunction })
			.validate

		validateMock.mockReturnValue(true)

		expect(validateFunction('')).toBe('value is required')
		expect(validateMock).toHaveBeenCalledTimes(0)

		expect(validateFunction('a')).toBe(true)
		expect(validateMock).toHaveBeenCalledExactlyOnceWith('a')
	})
})

describe('askForNumber', () => {
	it.each`
		input         | expected
		${'-1'}       | ${-1}
		${'0'}        | ${0}
		${'3.141592'} | ${3.141592}
		${''}         | ${undefined}
	`('returns number entered', async ({ input, expected }) => {
		promptMock.mockResolvedValue({ value: input })

		const result = await askForNumber('prompt message')

		expect(result).toBe(expected)
		expect(promptMock).toHaveBeenCalledExactlyOnceWith({
			type: 'input',
			name: 'value',
			message: 'prompt message',
			transformer: numberTransformer,
			validate: expect.any(Function),
		})
	})

	const getValidateFunction = async (min?: number, max?: number): Promise<ValidateFunction> => {
		promptMock.mockResolvedValue({ value: '' })

		const result = await askForNumber('prompt message', min, max)

		expect(result).toBe(undefined)
		expect(promptMock).toHaveBeenCalledExactlyOnceWith({
			type: 'input',
			name: 'value',
			message: 'prompt message',
			transformer: numberTransformer,
			validate: expect.any(Function),
		})

		return (promptMock.mock.calls[0][0] as { validate: ValidateFunction }).validate
	}

	it('validates empty as acceptable', async () => {
		const validateFunction = await getValidateFunction()
		expect(validateFunction('')).toBe(true)
	})

	it.each(['-5.5', '0', '0.3', '3.0', '7', '21553992'])(
		'validates numbers as acceptable',
		async value => {
			const validateFunction = await getValidateFunction()
			expect(validateFunction(value)).toBe(true)
		},
	)

	it.each(['abc', 'PI', 'twelve', '1/3'])('invalidates non-number values', async value => {
		const validateFunction = await getValidateFunction()
		expect(validateFunction(value)).toBe(`${value} is not a valid number`)
	})

	it.each(['-10.5', '0', '7.3', '2155.3992'])(
		'validates >= min values as acceptable',
		async value => {
			const validateFunction = await getValidateFunction(-10.5)
			expect(validateFunction(value)).toBe(true)
		},
	)

	it.each(['0', '1', '3.1416', '10.009'])('invalidates < min values', async value => {
		const validateFunction = await getValidateFunction(10.01)
		expect(validateFunction(value)).toBe('must be no less than 10.01')
	})

	it('invalidates < min values (0 min)', async () => {
		const validateFunction = await getValidateFunction(0)
		expect(validateFunction('-0.1')).toBe('must be no less than 0')
	})

	it.each(['0', '15', '15.3'])('validates <= max values as acceptable', async value => {
		const validateFunction = await getValidateFunction(undefined, 15.3)
		expect(validateFunction(value)).toBe(true)
	})

	it.each(['9.7501', '12', '100'])('invalidates > max values', async value => {
		const validateFunction = await getValidateFunction(undefined, 9.75)
		expect(validateFunction(value)).toBe('must be no more than 9.75')
	})

	it('invalidates > max values (0 max)', async () => {
		const validateFunction = await getValidateFunction(undefined, 0)
		expect(validateFunction('0.01')).toBe('must be no more than 0')
	})
})

describe('askForBoolean', () => {
	it('defaults to true', async () => {
		promptMock.mockResolvedValueOnce({ answer: false })

		expect(await askForBoolean('Are you absolutely certain?')).toBe(false)

		expect(promptMock).toHaveBeenCalledExactlyOnceWith({
			type: 'confirm',
			name: 'answer',
			message: 'Are you absolutely certain?',
			default: true,
		})
	})

	it('accepts alternate default', async () => {
		promptMock.mockResolvedValueOnce({ answer: true })

		expect(await askForBoolean('Are you absolutely certain?', { default: false })).toBe(true)

		expect(promptMock).toHaveBeenCalledExactlyOnceWith({
			type: 'confirm',
			name: 'answer',
			message: 'Are you absolutely certain?',
			default: false,
		})
	})
})
