import { jest } from '@jest/globals'

import inquirer from 'inquirer'

import { InputDefinition, cancelOption, uneditable } from '../../../lib/item-input/defs.js'
import {
	askForBoolean,
	askForString,
	askForOptionalString,
	ValidateFunction,
} from '../../../lib/user-query.js'
import { stringFromUnknown } from '../../../lib/util.js'


const promptMock: jest.Mock<typeof inquirer.prompt> = jest.fn()
jest.unstable_mockModule('inquirer', () => ({
	default: {
		prompt: promptMock,
		Separator: inquirer.Separator,
	},
}))
const askForBooleanMock: jest.Mock<typeof askForBoolean> = jest.fn()
const askForStringMock: jest.Mock<typeof askForString> = jest.fn()
const askForOptionalStringMock: jest.Mock<typeof askForOptionalString> = jest.fn()
jest.unstable_mockModule('../../../lib/user-query.js', () => ({
	askForBoolean: askForBooleanMock,
	askForString: askForStringMock,
	askForOptionalString: askForOptionalStringMock,
}))


const {
	booleanDef,
	computedDef,
	defaultWithContextFn,
	listSelectionDef,
	optionalDef,
	optionalStringDef,
	staticDef,
	stringDef,
	validateWithContextFn,
} = await import('../../../lib/item-input/misc.js')


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

describe('defaultWithContextFn', () => {
	it.each(['string', undefined])('returns "%s" unchanged', (inputDefault) => {
		expect(defaultWithContextFn(inputDefault)).toBe(inputDefault)
	})

	it.each([
		undefined,
		['string1'],
		['string1', 'string2'],
	])('passes specified context, %s, to new default function', (context) => {
		const originalDefaultFunction = jest.fn()
		originalDefaultFunction.mockReturnValue('validation result')
		const withContext = defaultWithContextFn(originalDefaultFunction, context) as () => string

		expect(withContext).toBeDefined()
		expect(withContext()).toBe('validation result')

		expect(originalDefaultFunction).toHaveBeenCalledTimes(1)
		expect(originalDefaultFunction).toHaveBeenCalledWith(context)
	})
})

describe('optionalStringDef', () => {
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

describe('booleanDef', () => {
	const def = booleanDef('Boolean Def')

	test('name', async () => {
		expect(def.name).toBe('Boolean Def')
	})

	test('build', async () => {
		askForBooleanMock.mockResolvedValueOnce(false)

		expect(await def.buildFromUserInput()).toBe(false)

		expect(askForBooleanMock).toHaveBeenCalledTimes(1)
		expect(askForBooleanMock).toHaveBeenCalledWith('Boolean Def', undefined)
	})

	test('summarize', async () => {
		expect(def.summarizeForEdit(true)).toBe('Yes')
		expect(def.summarizeForEdit(false)).toBe('No')
	})

	test('update', async () => {
		askForBooleanMock.mockResolvedValueOnce(false)

		expect(await def.updateFromUserInput(true)).toBe(false)

		expect(askForBooleanMock).toHaveBeenCalledTimes(1)
		expect(askForBooleanMock).toHaveBeenCalledWith('Boolean Def', { default: true })
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

	it.todo('calls recalculates when updateIfNeeded is called') // when implemented
})

describe('listSelectionDef', () => {
	test('name', () => {
		const def = listSelectionDef('List Selection Def', [])
		expect(def.name).toBe('List Selection Def')
	})

	describe('summarizeForEdit', () => {
		it('defaults to `stringFromUnknown` function', () => {
			const def = listSelectionDef('List Selection Def', [])
			expect(def.summarizeForEdit).toBe(stringFromUnknown)
		})

		it('accepts alternate as an option', () => {
			const summarizeForEdit = (): string => 'summary'
			const def = listSelectionDef('Def with custom summarize', [], { summarizeForEdit })
			expect(def.summarizeForEdit).toBe(summarizeForEdit)
		})
	})

	describe('updateFromUserInput', () => {
		it('builds choices from given options and adds cancel option', async () => {
			const summarizeForEditMock = jest.fn().mockImplementation((input: string): string => `${input} summary`)
			promptMock.mockResolvedValueOnce({ chosen: 'updated value' })
			const def = listSelectionDef('Thing One', ['un', 'dos', 'tres'], { summarizeForEdit: summarizeForEditMock })

			expect(await def.updateFromUserInput('original value')).toBe('updated value')

			expect(summarizeForEditMock).toHaveBeenCalledTimes(3)
			expect(summarizeForEditMock).toHaveBeenCalledWith('un')
			expect(summarizeForEditMock).toHaveBeenCalledWith('dos')
			expect(summarizeForEditMock).toHaveBeenCalledWith('tres')
			expect(promptMock).toHaveBeenCalledTimes(1)
			expect(promptMock).toHaveBeenCalledWith({
				type: 'list',
				name: 'chosen',
				message: 'Select Thing One:',
				choices: [
					{ name: 'un summary', value: 'un' },
					{ name: 'dos summary', value: 'dos' },
					{ name: 'tres summary', value: 'tres' },
					cancelOption,
				],
				default: 'original value',
			})
		})

		it.todo('includes help option when provided helpText') // when implemented
	})

	describe('buildFromUserInput', () => {
		it('proxies to update', async () => {
			promptMock.mockResolvedValueOnce({ chosen: 'chosen value' })
			const def = listSelectionDef('Thing One', ['un', 'dos', 'tres'])

			expect(await def.buildFromUserInput()).toBe('chosen value')

			expect(promptMock).toHaveBeenCalledTimes(1)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				default: undefined,
			}))
		})

		it('passes on default value to update', async () => {
			promptMock.mockResolvedValueOnce({ chosen: 'chosen value' })
			const def = listSelectionDef('Thing One', ['un', 'dos', 'tres'], { default: 'default value' })

			expect(await def.buildFromUserInput()).toBe('chosen value')

			expect(promptMock).toHaveBeenCalledTimes(1)
			expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
				default: 'default value',
			}))
		})
	})
})

describe('optionalDef', () => {
	const inputBuildFromUserInputMock = jest.fn()
	const inputSummarizeForEditMock = jest.fn().mockImplementation(item => `summarized ${item}`)
	const inputUpdateFromUserInputMock = jest.fn()
	const inputDefMock: InputDefinition<string> = {
		name: 'Input Def',
		buildFromUserInput: inputBuildFromUserInputMock,
		summarizeForEdit: inputSummarizeForEditMock,
		updateFromUserInput: inputUpdateFromUserInputMock,
	}

	it('takes name from inputDef', async () => {
		const def = optionalDef(inputDefMock, () => true)
		expect(def.name).toBe('Input Def')
	})

	describe('buildFromUserInput', () => {
		it('returns undefined when predicate not active', async () => {
			const checkIfActiveMock = jest.fn().mockReturnValue(false)
			const def = optionalDef(inputDefMock, checkIfActiveMock)

			expect(await def.buildFromUserInput()).toBe(undefined)

			expect(checkIfActiveMock).toHaveBeenCalledTimes(1)
			expect(checkIfActiveMock).toHaveBeenCalledWith(undefined)

			expect(inputBuildFromUserInputMock).toHaveBeenCalledTimes(0)
		})

		it('uses inputDef.buildFromUserInput when active', async () => {
			const checkIfActiveMock = jest.fn().mockReturnValue(true)
			inputBuildFromUserInputMock.mockResolvedValueOnce('entered value')
			const def = optionalDef(inputDefMock, checkIfActiveMock)

			expect(await def.buildFromUserInput(['context'])).toBe('entered value')

			expect(checkIfActiveMock).toHaveBeenCalledTimes(1)
			expect(checkIfActiveMock).toHaveBeenCalledWith(['context'])
			expect(inputBuildFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(inputBuildFromUserInputMock).toHaveBeenCalledWith(['context'])
		})
	})

	describe('summarizeForEdit', () => {
		it('uses inputDef.summarizeForEdit when active', () => {
			const checkIfActiveMock = jest.fn()
			inputSummarizeForEditMock.mockReturnValueOnce('summarized value')
			const def = optionalDef(inputDefMock, checkIfActiveMock, { initiallyActive: true })

			expect(def.summarizeForEdit('value to summarize', ['context'])).toBe('summarized value')

			expect(inputSummarizeForEditMock).toHaveBeenCalledTimes(1)
			expect(inputSummarizeForEditMock).toHaveBeenCalledWith('value to summarize', ['context'])

			expect(checkIfActiveMock).toHaveBeenCalledTimes(0)
		})

		it('returns uneditable when not active', () => {
			const checkIfActiveMock = jest.fn()
			const def = optionalDef(inputDefMock, checkIfActiveMock, { initiallyActive: false })

			expect(def.summarizeForEdit('value to summarize')).toBe(uneditable)

			expect(checkIfActiveMock).toHaveBeenCalledTimes(0)
			expect(inputSummarizeForEditMock).toHaveBeenCalledTimes(0)
		})
	})

	describe('updateFromUserInput', () => {
		it('uses inputDef.updateFromUserInput when active', async () => {
			const checkIfActiveMock = jest.fn()
			inputUpdateFromUserInputMock.mockReturnValueOnce('updated value')
			const def = optionalDef(inputDefMock, checkIfActiveMock, { initiallyActive: true })

			expect(await def.updateFromUserInput('value to update', ['context'])).toBe('updated value')

			expect(inputUpdateFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(inputUpdateFromUserInputMock).toHaveBeenCalledWith('value to update', ['context'])

			expect(checkIfActiveMock).toHaveBeenCalledTimes(0)
			expect(inputBuildFromUserInputMock).toHaveBeenCalledTimes(0)
		})

		it('uses inputDef.buildFromUserInput when no original value passed in', async () => {
			const checkIfActiveMock = jest.fn()
			const def = optionalDef(inputDefMock, checkIfActiveMock, { initiallyActive: true })
			inputBuildFromUserInputMock.mockReturnValueOnce('new value')

			expect(await def.updateFromUserInput(undefined, ['context'])).toBe('new value')

			expect(inputBuildFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(inputBuildFromUserInputMock).toHaveBeenCalledWith(['context'])

			expect(checkIfActiveMock).toHaveBeenCalledTimes(0)
			expect(inputUpdateFromUserInputMock).toHaveBeenCalledTimes(0)
		})

		it('returns undefined when not active', async () => {
			const checkIfActiveMock = jest.fn()
			const def = optionalDef(inputDefMock, checkIfActiveMock, { initiallyActive: false })

			expect(await def.updateFromUserInput('value to update')).toBe(undefined)

			expect(checkIfActiveMock).toHaveBeenCalledTimes(0)
			expect(inputUpdateFromUserInputMock).toHaveBeenCalledTimes(0)
		})
	})

	describe('updateIfNeeded', () => {
		const inputDefUpdateIfNeededMock = jest.fn()
		const inputDefWithUpdateIfNeededMock = {
			...inputDefMock,
			updateIfNeeded: inputDefUpdateIfNeededMock,
		}

		it('uses inputDef.updateIfNeeded when active and had been active', async () => {
			const checkIfActiveMock = jest.fn().mockReturnValue(true)
			inputDefUpdateIfNeededMock.mockReturnValueOnce('updated value')
			const def = optionalDef(inputDefWithUpdateIfNeededMock, checkIfActiveMock, { initiallyActive: true })

			expect(await def.updateIfNeeded?.('original', 'initiating updated prop', ['context'])).toBe('updated value')

			expect(checkIfActiveMock).toHaveBeenCalledTimes(1)
			expect(checkIfActiveMock).toHaveBeenCalledWith(['context'])
			expect(inputDefUpdateIfNeededMock).toHaveBeenCalledTimes(1)
			expect(inputDefUpdateIfNeededMock).toHaveBeenCalledWith('original', 'initiating updated prop', ['context'])

			expect(inputBuildFromUserInputMock).toHaveBeenCalledTimes(0)
		})

		it('returns original when active and had been active and there is no `inputDef.updateIfNeeded`', async () => {
			const checkIfActiveMock = jest.fn().mockReturnValue(true)
			const def = optionalDef(inputDefMock, checkIfActiveMock, { initiallyActive: true })

			expect(await def.updateIfNeeded?.('original', 'initiating updated prop', ['context'])).toBe('original')

			expect(checkIfActiveMock).toHaveBeenCalledTimes(1)
			expect(checkIfActiveMock).toHaveBeenCalledWith(['context'])
			expect(inputDefUpdateIfNeededMock).toHaveBeenCalledTimes(0)
		})

		it('uses inputDef.buildFromUserInput if previously inactive', async () => {
			const checkIfActiveMock = jest.fn().mockReturnValue(true)
			inputBuildFromUserInputMock.mockReturnValueOnce('newly entered value')
			const def = optionalDef(inputDefWithUpdateIfNeededMock, checkIfActiveMock, { initiallyActive: false })

			expect(await def.updateIfNeeded?.('original', 'initiating updated prop', ['context'])).toBe('newly entered value')

			expect(checkIfActiveMock).toHaveBeenCalledTimes(1)
			expect(checkIfActiveMock).toHaveBeenCalledWith(['context'])
			expect(inputBuildFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(inputBuildFromUserInputMock).toHaveBeenCalledWith(['context'])

			expect(inputDefUpdateIfNeededMock).toHaveBeenCalledTimes(0)
		})

		it('returns undefined if not active', async () => {
			const checkIfActiveMock = jest.fn().mockReturnValue(false)
			inputBuildFromUserInputMock.mockReturnValueOnce('delete this line!!!')
			const def = optionalDef(inputDefWithUpdateIfNeededMock, checkIfActiveMock)

			expect(await def.updateIfNeeded?.('original', 'initiating updated prop', ['context'])).toBe(undefined)

			expect(checkIfActiveMock).toHaveBeenCalledTimes(1)
			expect(checkIfActiveMock).toHaveBeenCalledWith(['context'])

			expect(inputDefUpdateIfNeededMock).toHaveBeenCalledTimes(0)
			expect(inputBuildFromUserInputMock).toHaveBeenCalledTimes(0)
		})
	})
})
