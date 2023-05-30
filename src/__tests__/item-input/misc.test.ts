import { uneditable } from '../../item-input/defs.js'
import { computedDef, optionalStringDef, staticDef, stringDef, validateWithContextFn } from '../../item-input/misc.js'
import { askForString, askForOptionalString, ValidateFunction } from '../../user-query.js'


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
	const askForOptionalStringMock = jest.mocked(askForOptionalString)

	describe('without validation', () => {
		const def = optionalStringDef('String Def')

		test('name', async () => {
			expect(def.name).toBe('String Def')
		})

		test('build', async () => {
			askForOptionalStringMock.mockResolvedValueOnce('user input')

			expect(await def.buildFromUserInput()).toBe('user input')

			expect(askForOptionalStringMock).toHaveBeenCalledTimes(1)
			expect(askForOptionalStringMock).toHaveBeenCalledWith('String Def (optional)',
				{ validate: undefined })
		})

		test('summarize', async () => {
			expect(def.summarizeForEdit('original')).toBe('original')
		})

		test('update', async () => {
			askForOptionalStringMock.mockResolvedValueOnce('updated')

			expect(await def.updateFromUserInput('original')).toBe('updated')

			expect(askForOptionalStringMock).toHaveBeenCalledTimes(1)
			expect(askForOptionalStringMock).toHaveBeenCalledWith('String Def (optional)',
				{ default: 'original', validate: undefined })
		})
	})

	describe('with validation', () => {
		const validateMock = jest.fn()
		const def = optionalStringDef('String Def', { validate: validateMock })

		test('build', async () => {
			const context = ['context item']
			askForOptionalStringMock.mockResolvedValueOnce('user input')

			expect(await def.buildFromUserInput(context)).toBe('user input')

			expect(askForOptionalStringMock).toHaveBeenCalledTimes(1)
			expect(askForOptionalStringMock).toHaveBeenCalledWith('String Def (optional)',
				{ validate: expect.any(Function) })

			const validateFn = askForOptionalStringMock.mock.calls[0][1]?.validate as ValidateFunction
			validateMock.mockReturnValueOnce('validation answer')
			expect(validateFn('input string')).toBe('validation answer')
			expect(validateMock).toHaveBeenCalledTimes(1)
			expect(validateMock).toHaveBeenCalledWith('input string', context)
		})

		test('update', async () => {
			const context = ['context item']
			askForOptionalStringMock.mockResolvedValueOnce('updated')

			expect(await def.updateFromUserInput('original', context)).toBe('updated')

			expect(askForOptionalStringMock).toHaveBeenCalledTimes(1)
			expect(askForOptionalStringMock).toHaveBeenCalledWith('String Def (optional)',
				{ default: 'original', validate: expect.any(Function) })

			const validateFn = askForOptionalStringMock.mock.calls[0][1]?.validate as ValidateFunction
			validateMock.mockReturnValueOnce('validation answer')
			expect(validateFn('input string')).toBe('validation answer')
			expect(validateMock).toHaveBeenCalledTimes(1)
			expect(validateMock).toHaveBeenCalledWith('input string', context)
		})
	})
})

describe('stringDef', () => {
	const askForStringMock = jest.mocked(askForString)

	describe('without validation', () => {
		const def = stringDef('String Def')

		test('name', async () => {
			expect(def.name).toBe('String Def')
		})

		test('build', async () => {
			askForStringMock.mockResolvedValueOnce('user input')

			expect(await def.buildFromUserInput()).toBe('user input')

			expect(askForStringMock).toHaveBeenCalledTimes(1)
			expect(askForStringMock).toHaveBeenCalledWith('String Def', { validate: undefined })
		})

		test('summarize', async () => {
			expect(def.summarizeForEdit('original')).toBe('original')
		})

		test('update', async () => {
			askForStringMock.mockResolvedValueOnce('updated')

			expect(await def.updateFromUserInput('original')).toBe('updated')

			expect(askForStringMock).toHaveBeenCalledTimes(1)
			expect(askForStringMock).toHaveBeenCalledWith('String Def', { default: 'original' })
		})
	})

	describe('with validation', () => {
		const validateMock = jest.fn()
		const def = stringDef('String Def', { validate: validateMock })

		test('build', async () => {
			const context = ['context item']
			askForStringMock.mockResolvedValueOnce('user input')

			expect(await def.buildFromUserInput(context)).toBe('user input')

			expect(askForStringMock).toHaveBeenCalledTimes(1)
			expect(askForStringMock).toHaveBeenCalledWith('String Def',
				{ validate: expect.any(Function) })

			const validateFn = askForStringMock.mock.calls[0][1]?.validate as ValidateFunction
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
			expect(askForStringMock).toHaveBeenCalledWith('String Def',
				{ default: 'original', validate: expect.any(Function) })

			const validateFn = askForStringMock.mock.calls[0][1]?.validate as ValidateFunction
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
