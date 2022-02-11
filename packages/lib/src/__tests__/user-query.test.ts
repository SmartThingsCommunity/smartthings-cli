import inquirer from 'inquirer'
import { askForInteger, askForNumber, askForRequiredString, askForString, numberTransformer, ValidateFunction } from '../user-query'


describe('user-query', () => {
	const promptSpy = jest.spyOn(inquirer, 'prompt')

	afterEach(() => {
		jest.clearAllMocks()
	})

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

	describe('askForString', () => {
		it('ask user correct question', async () => {
			promptSpy.mockResolvedValue({ value: 'entered value' })

			const result = await askForString('prompt message')

			expect(result).toBe('entered value')
			expect(promptSpy).toHaveBeenCalledTimes(1)
			expect(promptSpy).toHaveBeenCalledWith({
				type: 'input',
				name: 'value',
				message: 'prompt message',
			})
		})

		it('returns nothing entered as undefined', async () => {
			promptSpy.mockResolvedValue({ value: '' })

			const result = await askForString('prompt message')

			expect(result).toBe(undefined)
			expect(promptSpy).toHaveBeenCalledTimes(1)
			expect(promptSpy).toHaveBeenCalledWith({
				type: 'input',
				name: 'value',
				message: 'prompt message',
			})
		})
	})

	describe('askForRequiredString', () => {
		it('requires input', async () => {
			promptSpy.mockResolvedValue({ value: 'entered value' })

			const result = await askForRequiredString('prompt message')

			expect(result).toBe('entered value')
			expect(promptSpy).toHaveBeenCalledTimes(1)
			expect(promptSpy).toHaveBeenCalledWith({
				type: 'input',
				name: 'value',
				message: 'prompt message',
				validate: expect.any(Function),
			})

			const validateFunction = (promptSpy.mock.calls[0][0] as { validate: ValidateFunction }).validate

			expect(validateFunction('')).toBe('value is required')
			expect(validateFunction('a')).toBe(true)
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
			promptSpy.mockResolvedValue({ value: input })

			const result = await askForInteger('prompt message')

			expect(result).toBe(expected)
			expect(promptSpy).toHaveBeenCalledTimes(1)
			expect(promptSpy).toHaveBeenCalledWith({
				type: 'input',
				name: 'value',
				message: 'prompt message',
				transformer: numberTransformer,
				validate: expect.any(Function),
			})
		})

		const getValidateFunction = async (min?: number, max?: number): Promise<ValidateFunction> => {
			promptSpy.mockResolvedValue({ value: '' })

			const result = await askForInteger('prompt message', min, max)

			expect(result).toBe(undefined)
			expect(promptSpy).toHaveBeenCalledTimes(1)
			expect(promptSpy).toHaveBeenCalledWith({
				type: 'input',
				name: 'value',
				message: 'prompt message',
				transformer: numberTransformer,
				validate: expect.any(Function),
			})

			return (promptSpy.mock.calls[0][0] as { validate: ValidateFunction }).validate
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
			promptSpy.mockResolvedValue({ value: input })

			const result = await askForNumber('prompt message')

			expect(result).toBe(expected)
			expect(promptSpy).toHaveBeenCalledTimes(1)
			expect(promptSpy).toHaveBeenCalledWith({
				type: 'input',
				name: 'value',
				message: 'prompt message',
				transformer: numberTransformer,
				validate: expect.any(Function),
			})
		})

		const getValidateFunction = async (min?: number, max?: number): Promise<ValidateFunction> => {
			promptSpy.mockResolvedValue({ value: '' })

			const result = await askForNumber('prompt message', min, max)

			expect(result).toBe(undefined)
			expect(promptSpy).toHaveBeenCalledTimes(1)
			expect(promptSpy).toHaveBeenCalledWith({
				type: 'input',
				name: 'value',
				message: 'prompt message',
				transformer: numberTransformer,
				validate: expect.any(Function),
			})

			return (promptSpy.mock.calls[0][0] as { validate: ValidateFunction }).validate
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
})
