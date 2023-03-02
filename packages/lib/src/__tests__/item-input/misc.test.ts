import { computedDef, optionalStringDef, staticDef, stringDef, uneditable, validateWithContextFn } from '../../item-input'
import { askForRequiredString, askForString, ValidateFunction } from '../../user-query'


jest.mock('../../user-query')

describe('validateWithContext', () => {
	it('returns undefined when not given a validation function to convert', () => {
		expect(validateWithContextFn()).toBe(undefined)
		expect(validateWithContextFn(undefined)).toBe(undefined)
	})

	it.each([
		undefined,
		['string1'],
		['string1', 'string2'],
	])('passes specified context, %s, to new validation function', (context) => {
		const validate = jest.fn()
		validate.mockReturnValue('validation result')
		const withContext = validateWithContextFn(validate, context) as ValidateFunction

		expect(withContext).toBeDefined()
		expect(withContext('input string')).toBe('validation result')

		expect(validate).toHaveBeenCalledTimes(1)
		expect(validate).toHaveBeenCalledWith('input string', context)
	})
})

describe('optionalStringDef', () => {
	const askForStringMock = jest.mocked(askForString)

	describe('without validation', () => {
		const def = optionalStringDef('String Def')

		test('name', async () => {
			expect(def.name).toBe('String Def')
		})

		test('build', async () => {
			askForStringMock.mockResolvedValueOnce('user input')

			expect(await def.buildFromUserInput()).toBe('user input')

			expect(askForStringMock).toHaveBeenCalledTimes(1)
			expect(askForStringMock).toHaveBeenCalledWith('String Def (optional)', undefined)
		})

		test('summarize', async () => {
			expect(def.summarizeForEdit('original')).toBe('original')
		})

		test('update', async () => {
			askForStringMock.mockResolvedValueOnce('updated')

			expect(await def.updateFromUserInput('original')).toBe('updated')

			expect(askForStringMock).toHaveBeenCalledTimes(1)
			expect(askForStringMock).toHaveBeenCalledWith('String Def (optional)', undefined, { default: 'original' })
		})
	})

	describe('with validation', () => {
		const validateMock = jest.fn()
		const def = optionalStringDef('String Def', validateMock)

		test('build', async () => {
			const context = ['context item']
			askForStringMock.mockResolvedValueOnce('user input')

			expect(await def.buildFromUserInput(context)).toBe('user input')

			expect(askForStringMock).toHaveBeenCalledTimes(1)
			expect(askForStringMock).toHaveBeenCalledWith('String Def (optional)', expect.any(Function))

			const validateFn = askForStringMock.mock.calls[0][1] as ValidateFunction
			validateMock.mockReturnValueOnce('validation answer')
			expect(validateFn('input string')).toBe('validation answer')
			expect(validateMock).toHaveBeenCalledTimes(1)
			expect(validateMock).toHaveBeenCalledWith('input string', context)
		})

		test('update', async () => {
			const context = ['context item']
			askForStringMock.mockResolvedValueOnce('updated')

			expect(await def.updateFromUserInput('original', context)).toBe('updated')

			expect(askForStringMock).toHaveBeenCalledTimes(1)
			expect(askForStringMock).toHaveBeenCalledWith('String Def (optional)', expect.any(Function), { default: 'original' })

			const validateFn = askForStringMock.mock.calls[0][1] as ValidateFunction
			validateMock.mockReturnValueOnce('validation answer')
			expect(validateFn('input string')).toBe('validation answer')
			expect(validateMock).toHaveBeenCalledTimes(1)
			expect(validateMock).toHaveBeenCalledWith('input string', context)
		})
	})
})

describe('stringDef', () => {
	const askForRequiredStringMock = jest.mocked(askForRequiredString)

	describe('without validation', () => {
		const def = stringDef('String Def')

		test('name', async () => {
			expect(def.name).toBe('String Def')
		})

		test('build', async () => {
			askForRequiredStringMock.mockResolvedValueOnce('user input')

			expect(await def.buildFromUserInput()).toBe('user input')

			expect(askForRequiredStringMock).toHaveBeenCalledTimes(1)
			expect(askForRequiredStringMock).toHaveBeenCalledWith('String Def', undefined)
		})

		test('summarize', async () => {
			expect(def.summarizeForEdit('original')).toBe('original')
		})

		test('update', async () => {
			askForRequiredStringMock.mockResolvedValueOnce('updated')

			expect(await def.updateFromUserInput('original')).toBe('updated')

			expect(askForRequiredStringMock).toHaveBeenCalledTimes(1)
			expect(askForRequiredStringMock).toHaveBeenCalledWith('String Def', undefined, { default: 'original' })
		})
	})

	describe('with validation', () => {
		const validateMock = jest.fn()
		const def = stringDef('String Def', validateMock)

		test('build', async () => {
			const context = ['context item']
			askForRequiredStringMock.mockResolvedValueOnce('user input')

			expect(await def.buildFromUserInput(context)).toBe('user input')

			expect(askForRequiredStringMock).toHaveBeenCalledTimes(1)
			expect(askForRequiredStringMock).toHaveBeenCalledWith('String Def', expect.any(Function))

			const validateFn = askForRequiredStringMock.mock.calls[0][1] as ValidateFunction
			validateMock.mockReturnValueOnce('validation answer')
			expect(validateFn('input string')).toBe('validation answer')
			expect(validateMock).toHaveBeenCalledTimes(1)
			expect(validateMock).toHaveBeenCalledWith('input string', context)
		})

		test('update', async () => {
			const context = ['context item']
			askForRequiredStringMock.mockResolvedValueOnce('updated')

			expect(await def.updateFromUserInput('original', context)).toBe('updated')

			expect(askForRequiredStringMock).toHaveBeenCalledTimes(1)
			expect(askForRequiredStringMock).toHaveBeenCalledWith('String Def', expect.any(Function), { default: 'original' })

			const validateFn = askForRequiredStringMock.mock.calls[0][1] as ValidateFunction
			validateMock.mockReturnValueOnce('validation answer')
			expect(validateFn('input string')).toBe('validation answer')
			expect(validateMock).toHaveBeenCalledTimes(1)
			expect(validateMock).toHaveBeenCalledWith('input string', context)
		})
	})
})

describe('staticDef', () => {
	it('uses the static value', async () => {
		const def = staticDef('static value')

		expect(def.name).toBe('unused')
		expect(await def.buildFromUserInput()).toBe('static value')
		expect(def.summarizeForEdit('unused value')).toBe(uneditable)
		expect(await def.updateFromUserInput('any value')).toBe('static value')
	})
})

describe('computedDef', () => {
	it('computes the value on build and update', async () => {
		const context = ['context item']
		const computeMock = jest.fn()

		const def = computedDef(computeMock)

		expect(def.name).toBe('unused')

		computeMock.mockReturnValueOnce('initial computed value')
		expect(await def.buildFromUserInput(context)).toBe('initial computed value')
		expect(computeMock).toHaveBeenCalledTimes(1)
		expect(computeMock).toHaveBeenCalledWith(context)
		computeMock.mockReset()

		expect(def.summarizeForEdit('unused value')).toBe(uneditable)

		computeMock.mockReturnValueOnce('recomputed value')
		expect(await def.updateFromUserInput('any value', context)).toBe('recomputed value')
		expect(computeMock).toHaveBeenCalledTimes(1)
		expect(computeMock).toHaveBeenCalledWith(context)
	})
})
