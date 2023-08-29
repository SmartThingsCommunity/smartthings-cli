import inquirer from 'inquirer'

import {
	askForBoolean,
	askForInteger,
	askForNumber,
	askForString,
	askForOptionalString,
	numberTransformer,
	ValidateFunction,
} from '../../lib/user-query.js'


jest.mock('inquirer')

const promptMock = jest.mocked(inquirer.prompt)

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => true)


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
	it('ask user correct question', async () => {
		promptMock.mockResolvedValue({ value: 'entered value' })

		const result = await askForOptionalString('prompt message')

		expect(result).toBe('entered value')
		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith({
			type: 'input',
			name: 'value',
			message: 'prompt message',
		})
	})

	it('returns nothing entered as undefined', async () => {
		promptMock.mockResolvedValue({ value: '' })

		const result = await askForOptionalString('prompt message')

		expect(result).toBe(undefined)
		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith({
			type: 'input',
			name: 'value',
			message: 'prompt message',
		})
	})

	it('passes validate to inquirer', async () => {
		promptMock.mockResolvedValue({ value: '' })

		const validateMock = jest.fn().mockReturnValueOnce(true)
		const result = await askForOptionalString('prompt message', { validate: validateMock })

		expect(result).toBe(undefined)
		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith({
			type: 'input',
			name: 'value',
			message: 'prompt message',
			validate: expect.any(Function),
		})

		const generatedValidate = (promptMock.mock.calls[0][0] as { validate: ValidateFunction }).validate
		expect(generatedValidate('input string')).toBe(true)
		expect(validateMock).toHaveBeenCalledTimes(1)
		expect(validateMock).toHaveBeenCalledWith('input string')
	})

	it('passes default to inquirer', async () => {
		promptMock.mockResolvedValue({ value: '' })

		const result = await askForOptionalString('prompt message', { default: 'default value' })

		expect(result).toBe(undefined)
		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith({
			type: 'input',
			name: 'value',
			message: 'prompt message',
			default: 'default value',
		})
	})

	it('displays help text when "?" entered', async () => {
		promptMock.mockResolvedValueOnce({ value: '?' })
		promptMock.mockResolvedValueOnce({ value: 'entered value' })

		const result = await askForOptionalString('prompt message', { helpText: 'help text' })

		expect(result).toBe('entered value')
		expect(promptMock).toHaveBeenCalledWith({
			type: 'input',
			name: 'value',
			message: 'prompt message (? for help)',
		})
		expect(consoleLogSpy).toHaveBeenLastCalledWith('help text')
	})

	it('allows "?" even with custom validate function', async () => {
		const validateMock = jest.fn().mockReturnValue(true)
		promptMock.mockResolvedValueOnce({ value: '?' })
		promptMock.mockResolvedValueOnce({ value: 'entered value' })

		const result = await askForOptionalString('prompt message', { helpText: 'help text', validate: validateMock })

		expect(result).toBe('entered value')
		expect(promptMock).toHaveBeenCalledWith({
			type: 'input',
			name: 'value',
			message: 'prompt message (? for help)',
			validate: expect.any(Function),
		})
		expect(consoleLogSpy).toHaveBeenLastCalledWith('help text')

		const generatedValidate = (promptMock.mock.calls[0][0] as { validate: ValidateFunction }).validate
		expect(generatedValidate('?')).toBeTrue()
		expect(validateMock).toHaveBeenCalledTimes(0)

		validateMock.mockReturnValueOnce('please enter better input')
		expect(generatedValidate('bad input')).toBe('please enter better input')
		expect(validateMock).toHaveBeenCalledTimes(1)
		expect(validateMock).toHaveBeenCalledWith('bad input')
	})

	it('accepts function for default value', async () => {
		promptMock.mockResolvedValue({ value: 'chosen value' })

		const result = await askForOptionalString('prompt message', { default: () => 'calculated default value' })

		expect(result).toBe('chosen value')
		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith({
			type: 'input',
			name: 'value',
			message: 'prompt message',
			default: 'calculated default value',
		})
	})
})

describe('askForString', () => {
	it('requires input', async () => {
		promptMock.mockResolvedValue({ value: 'entered value' })

		const result = await askForString('prompt message')

		expect(result).toBe('entered value')
		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith({
			type: 'input',
			name: 'value',
			message: 'prompt message',
			validate: expect.any(Function),
		})

		const validateFunction = (promptMock.mock.calls[0][0] as { validate: ValidateFunction }).validate

		expect(validateFunction('')).toBe('value is required')
		expect(validateFunction('a')).toBe(true)
	})

	it('incorporates supplied validation', async () => {
		promptMock.mockResolvedValue({ value: 'entered value' })

		const validateMock: jest.Mock<true, [string]> = jest.fn()
		const result = await askForString('prompt message', { validate: validateMock })

		expect(result).toBe('entered value')
		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith({
			type: 'input',
			name: 'value',
			message: 'prompt message',
			validate: expect.any(Function),
		})

		const validateFunction = (promptMock.mock.calls[0][0] as { validate: ValidateFunction }).validate

		validateMock.mockReturnValue(true)

		expect(validateFunction('')).toBe('value is required')
		expect(validateMock).toHaveBeenCalledTimes(0)

		expect(validateFunction('a')).toBe(true)
		expect(validateMock).toHaveBeenCalledTimes(1)
		expect(validateMock).toHaveBeenCalledWith('a')
	})
})

describe('askForInteger', () => {
	it.each`
		input   | expected
		${'-1'} | ${-1}
		${'0'}  | ${0}
		${'7'}  | ${7}
		${''}   | ${undefined}
	`('returns number entered', async ({ input, expected }) => {
		promptMock.mockResolvedValue({ value: input })

		const result = await askForInteger('prompt message')

		expect(result).toBe(expected)
		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith({
			type: 'input',
			name: 'value',
			message: 'prompt message',
			transformer: numberTransformer,
			validate: expect.any(Function),
		})
	})

	const getValidateFunction = async (min?: number, max?: number): Promise<ValidateFunction> => {
		promptMock.mockResolvedValue({ value: '' })

		const result = await askForInteger('prompt message', min, max)

		expect(result).toBe(undefined)
		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith({
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

	it.each(['-5', '0', '7', '21553992'])('validates integers as acceptable', async value => {
		const validateFunction = await getValidateFunction()
		expect(validateFunction(value)).toBe(true)
	})

	it.each(['abc', '3.1415', '-12.7', '1/3'])('invalidates non-integer values', async value => {
		const validateFunction = await getValidateFunction()
		expect(validateFunction(value)).toBe(`${value} is not a valid integer`)
	})

	it.each(['-10', '0', '7', '21553992'])('validates >= min values as acceptable', async value => {
		const validateFunction = await getValidateFunction(-10)
		expect(validateFunction(value)).toBe(true)
	})

	it.each(['0', '1', '3', '9'])('invalidates < min values', async value => {
		const validateFunction = await getValidateFunction(10)
		expect(validateFunction(value)).toBe('must be no less than 10')
	})

	it('invalidates < min values (0 min)', async () => {
		const validateFunction = await getValidateFunction(0)
		expect(validateFunction('-10')).toBe('must be no less than 0')
	})

	it.each(['0', '15', '150'])('validates <= max values as acceptable', async value => {
		const validateFunction = await getValidateFunction(undefined, 150)
		expect(validateFunction(value)).toBe(true)
	})

	it.each(['12', '100'])('invalidates > max values', async value => {
		const validateFunction = await getValidateFunction(undefined, 10)
		expect(validateFunction(value)).toBe('must be no more than 10')
	})

	it('invalidates > max values (0 max)', async () => {
		const validateFunction = await getValidateFunction(undefined, 0)
		expect(validateFunction('1')).toBe('must be no more than 0')
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
		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith({
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
		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith({
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

	it.each(['-5.5', '0', '0.3', '3.0', '7', '21553992'])('validates numbers as acceptable', async value => {
		const validateFunction = await getValidateFunction()
		expect(validateFunction(value)).toBe(true)
	})

	it.each(['abc', 'PI', 'twelve', '1/3'])('invalidates non-number values', async value => {
		const validateFunction = await getValidateFunction()
		expect(validateFunction(value)).toBe(`${value} is not a valid number`)
	})

	it.each(['-10.5', '0', '7.3', '2155.3992'])('validates >= min values as acceptable', async value => {
		const validateFunction = await getValidateFunction(-10.5)
		expect(validateFunction(value)).toBe(true)
	})

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

		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith({
			type: 'confirm',
			name: 'answer',
			message: 'Are you absolutely certain?',
			default: true,
		})
	})

	it('accepts alternate default', async () => {
		promptMock.mockResolvedValueOnce({ answer: true })

		expect(await askForBoolean('Are you absolutely certain?', { default: false })).toBe(true)

		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith({
			type: 'confirm',
			name: 'answer',
			message: 'Are you absolutely certain?',
			default: false,
		})
	})
})
