import { jest } from '@jest/globals'

import inquirer from 'inquirer'

import {
	cancelOption,
	type DefaultValueFunction,
	type InputDefinition,
	type InputDefinitionValidateFunction,
	uneditable,
} from '../../../lib/item-input/defs.js'
import type {
	booleanInput,
	integerInput,
	optionalIntegerInput,
	optionalStringInput,
	stringInput,
	ValidateFunction,
} from '../../../lib/user-query.js'
import { stringFromUnknown } from '../../../lib/util.js'
import type { ListSelectionDefOptions, OptionalDefPredicateFn } from '../../../lib/item-input/misc.js'
import { buildInputDefMock } from '../../test-lib/input-type-mock.js'


const promptMock = jest.fn<typeof inquirer.prompt>()
jest.unstable_mockModule('inquirer', () => ({
	default: {
		prompt: promptMock,
		Separator: inquirer.Separator,
	},
}))
const booleanInputMock = jest.fn<typeof booleanInput>()
const integerInputMock = jest.fn<typeof integerInput>()
const optionalIntegerInputMock = jest.fn<typeof optionalIntegerInput>()
const optionalStringInputMock = jest.fn<typeof optionalStringInput>()
const stringInputMock = jest.fn<typeof stringInput>()
jest.unstable_mockModule('../../../lib/user-query.js', () => ({
	booleanInput: booleanInputMock,
	integerInput: integerInputMock,
	optionalIntegerInput: optionalIntegerInputMock,
	optionalStringInput: optionalStringInputMock,
	stringInput: stringInputMock,
}))


const {
	booleanDef,
	computedDef,
	defaultWithContextFn,
	integerDef,
	listSelectionDef,
	optionalDef,
	optionalIntegerDef,
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
		const validate = jest.fn<ValidateFunction<string>>()
		validate.mockReturnValue('validation result')
		const withContext = validateWithContextFn(validate, context) as ValidateFunction<string>

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
		const originalDefaultFunction = jest.fn<DefaultValueFunction<string>>()
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
			optionalStringInputMock.mockResolvedValueOnce('user input')

			expect(await def.buildFromUserInput()).toBe('user input')

			expect(optionalStringInputMock).toHaveBeenCalledTimes(1)
			expect(optionalStringInputMock).toHaveBeenCalledWith('String Def (optional)',
				{ validate: undefined })
		})

		test('summarize', async () => {
			expect(def.summarizeForEdit('original')).toBe('original')
		})

		test('update', async () => {
			optionalStringInputMock.mockResolvedValueOnce('updated')

			expect(await def.updateFromUserInput('original')).toBe('updated')

			expect(optionalStringInputMock).toHaveBeenCalledTimes(1)
			expect(optionalStringInputMock).toHaveBeenCalledWith('String Def (optional)',
				{ default: 'original', validate: undefined })
		})
	})

	describe('with validation', () => {
		const validateMock = jest.fn<InputDefinitionValidateFunction<string>>()
		const def = optionalStringDef('String Def', { validate: validateMock })

		test('build', async () => {
			const context = ['context item']
			optionalStringInputMock.mockResolvedValueOnce('user input')

			expect(await def.buildFromUserInput(context)).toBe('user input')

			expect(optionalStringInputMock).toHaveBeenCalledTimes(1)
			expect(optionalStringInputMock).toHaveBeenCalledWith('String Def (optional)',
				{ validate: expect.any(Function) })

			const validateFn = optionalStringInputMock.mock.calls[0][1]?.validate as ValidateFunction<string>
			validateMock.mockReturnValueOnce('validation answer')
			expect(validateFn('input string')).toBe('validation answer')
			expect(validateMock).toHaveBeenCalledTimes(1)
			expect(validateMock).toHaveBeenCalledWith('input string', context)
		})

		test('update', async () => {
			const context = ['context item']
			optionalStringInputMock.mockResolvedValueOnce('updated')

			expect(await def.updateFromUserInput('original', context)).toBe('updated')

			expect(optionalStringInputMock).toHaveBeenCalledTimes(1)
			expect(optionalStringInputMock).toHaveBeenCalledWith('String Def (optional)',
				{ default: 'original', validate: expect.any(Function) })

			const validateFn = optionalStringInputMock.mock.calls[0][1]?.validate as ValidateFunction<string>
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
			stringInputMock.mockResolvedValueOnce('user input')

			expect(await def.buildFromUserInput()).toBe('user input')

			expect(stringInputMock).toHaveBeenCalledTimes(1)
			expect(stringInputMock).toHaveBeenCalledWith('String Def', { validate: undefined })
		})

		test('summarize', async () => {
			expect(def.summarizeForEdit('original')).toBe('original')
		})

		test('update', async () => {
			stringInputMock.mockResolvedValueOnce('updated')

			expect(await def.updateFromUserInput('original')).toBe('updated')

			expect(stringInputMock).toHaveBeenCalledTimes(1)
			expect(stringInputMock).toHaveBeenCalledWith('String Def', { default: 'original' })
		})
	})

	describe('with validation', () => {
		const validateMock = jest.fn<InputDefinitionValidateFunction<string>>()
		const def = stringDef('String Def', { validate: validateMock })

		test('build', async () => {
			const context = ['context item']
			stringInputMock.mockResolvedValueOnce('user input')

			expect(await def.buildFromUserInput(context)).toBe('user input')

			expect(stringInputMock).toHaveBeenCalledTimes(1)
			expect(stringInputMock).toHaveBeenCalledWith('String Def',
				{ validate: expect.any(Function) })

			const validateFn = stringInputMock.mock.calls[0][1]?.validate as ValidateFunction<string>
			validateMock.mockReturnValueOnce('validation answer')
			expect(validateFn('input string')).toBe('validation answer')
			expect(validateMock).toHaveBeenCalledTimes(1)
			expect(validateMock).toHaveBeenCalledWith('input string', context)
		})

		test('update', async () => {
			const context = ['context item']
			stringInputMock.mockResolvedValueOnce('updated')

			expect(await def.updateFromUserInput('original', context)).toBe('updated')

			expect(stringInputMock).toHaveBeenCalledTimes(1)
			expect(stringInputMock).toHaveBeenCalledWith('String Def',
				{ default: 'original', validate: expect.any(Function) })

			const validateFn = stringInputMock.mock.calls[0][1]?.validate as ValidateFunction<string>
			validateMock.mockReturnValueOnce('validation answer')
			expect(validateFn('input string')).toBe('validation answer')
			expect(validateMock).toHaveBeenCalledTimes(1)
			expect(validateMock).toHaveBeenCalledWith('input string', context)
		})
	})
})

describe('optionalIntegerDef', () => {
	describe('without validation', () => {
		const def = optionalIntegerDef('Integer Def')

		test('name', async () => {
			expect(def.name).toBe('Integer Def')
		})

		test('build', async () => {
			optionalIntegerInputMock.mockResolvedValueOnce(17)

			expect(await def.buildFromUserInput()).toBe(17)

			expect(optionalIntegerInputMock).toHaveBeenCalledTimes(1)
			expect(optionalIntegerInputMock).toHaveBeenCalledWith('Integer Def (optional)',
				{ validate: undefined })
		})

		test('summarize', async () => {
			expect(def.summarizeForEdit(451)).toBe('451')
		})

		test('update', async () => {
			optionalIntegerInputMock.mockResolvedValueOnce(13)

			expect(await def.updateFromUserInput(12)).toBe(13)

			expect(optionalIntegerInputMock).toHaveBeenCalledTimes(1)
			expect(optionalIntegerInputMock).toHaveBeenCalledWith('Integer Def (optional)',
				{ default: 12, validate: undefined })
		})
	})

	describe('with validation', () => {
		const validateMock = jest.fn<InputDefinitionValidateFunction<number | undefined>>()
		const def = optionalIntegerDef('Integer Def', { validate: validateMock })

		test('build', async () => {
			const context = ['context item']
			optionalIntegerInputMock.mockResolvedValueOnce(11)

			expect(await def.buildFromUserInput(context)).toBe(11)

			expect(optionalIntegerInputMock).toHaveBeenCalledTimes(1)
			expect(optionalIntegerInputMock).toHaveBeenCalledWith('Integer Def (optional)',
				{ validate: expect.any(Function) })

			const validateFn = optionalIntegerInputMock.mock.calls[0][1]?.validate as
				ValidateFunction<number | undefined>
			validateMock.mockReturnValueOnce('validation answer')
			expect(validateFn(444)).toBe('validation answer')
			expect(validateMock).toHaveBeenCalledTimes(1)
			expect(validateMock).toHaveBeenCalledWith(444, context)
		})

		test('update', async () => {
			const context = ['context item']
			optionalIntegerInputMock.mockResolvedValueOnce(13)

			expect(await def.updateFromUserInput(12, context)).toBe(13)

			expect(optionalIntegerInputMock).toHaveBeenCalledTimes(1)
			expect(optionalIntegerInputMock).toHaveBeenCalledWith('Integer Def (optional)',
				{ default: 12, validate: expect.any(Function) })

			const validateFn = optionalIntegerInputMock.mock.calls[0][1]?.validate as ValidateFunction<number | undefined>
			validateMock.mockReturnValueOnce('validation answer')
			expect(validateFn(22)).toBe('validation answer')
			expect(validateMock).toHaveBeenCalledTimes(1)
			expect(validateMock).toHaveBeenCalledWith(22, context)
		})
	})
})

describe('integerDef', () => {
	describe('without validation', () => {
		const def = integerDef('Integer Def')

		test('name', async () => {
			expect(def.name).toBe('Integer Def')
		})

		test('build', async () => {
			integerInputMock.mockResolvedValueOnce(11)

			expect(await def.buildFromUserInput()).toBe(11)

			expect(integerInputMock).toHaveBeenCalledTimes(1)
			expect(integerInputMock).toHaveBeenCalledWith('Integer Def', { validate: undefined })
		})

		test('summarize', async () => {
			expect(def.summarizeForEdit(20000)).toBe('20000')
		})

		test('update', async () => {
			integerInputMock.mockResolvedValueOnce(13)

			expect(await def.updateFromUserInput(12)).toBe(13)

			expect(integerInputMock).toHaveBeenCalledTimes(1)
			expect(integerInputMock).toHaveBeenCalledWith('Integer Def', { default: 12 })
		})
	})

	describe('with validation', () => {
		const validateMock = jest.fn<InputDefinitionValidateFunction<number | undefined>>()
		const def = integerDef('Integer Def', { validate: validateMock })

		test('build', async () => {
			const context = ['context item']
			integerInputMock.mockResolvedValueOnce(17)

			expect(await def.buildFromUserInput(context)).toBe(17)

			expect(integerInputMock).toHaveBeenCalledTimes(1)
			expect(integerInputMock).toHaveBeenCalledWith('Integer Def',
				{ validate: expect.any(Function) })

			const validateFn = integerInputMock.mock.calls[0][1]?.validate as ValidateFunction<number | undefined>
			validateMock.mockReturnValueOnce('validation answer')
			expect(validateFn(7)).toBe('validation answer')
			expect(validateMock).toHaveBeenCalledTimes(1)
			expect(validateMock).toHaveBeenCalledWith(7, context)
		})

		test('update', async () => {
			const context = ['context item']
			integerInputMock.mockResolvedValueOnce(19)

			expect(await def.updateFromUserInput(18, context)).toBe(19)

			expect(integerInputMock).toHaveBeenCalledTimes(1)
			expect(integerInputMock).toHaveBeenCalledWith('Integer Def',
				{ default: 18, validate: expect.any(Function) })

			const validateFn = integerInputMock.mock.calls[0][1]?.validate as ValidateFunction<number | undefined>
			validateMock.mockReturnValueOnce('validation answer')
			expect(validateFn(65536)).toBe('validation answer')
			expect(validateMock).toHaveBeenCalledTimes(1)
			expect(validateMock).toHaveBeenCalledWith(65536, context)
		})
	})
})

describe('booleanDef', () => {
	const def = booleanDef('Boolean Def')

	test('name', async () => {
		expect(def.name).toBe('Boolean Def')
	})

	test('build', async () => {
		booleanInputMock.mockResolvedValueOnce(false)

		expect(await def.buildFromUserInput()).toBe(false)

		expect(booleanInputMock).toHaveBeenCalledTimes(1)
		expect(booleanInputMock).toHaveBeenCalledWith('Boolean Def', undefined)
	})

	test('summarize', async () => {
		expect(def.summarizeForEdit(true)).toBe('Yes')
		expect(def.summarizeForEdit(false)).toBe('No')
	})

	test('update', async () => {
		booleanInputMock.mockResolvedValueOnce(false)

		expect(await def.updateFromUserInput(true)).toBe(false)

		expect(booleanInputMock).toHaveBeenCalledTimes(1)
		expect(booleanInputMock).toHaveBeenCalledWith('Boolean Def', { default: true })
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
			const summarizeForEditMock = jest.fn<Required<ListSelectionDefOptions<string>>['summarizeForEdit']>()
				.mockImplementation((input: string): string => `${input} summary`)
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
	const inputDefMock = buildInputDefMock<string>('Input Def')
	const {
		buildFromUserInput: inputBuildFromUserInputMock,
		summarizeForEdit: inputSummarizeForEditMock,
		updateFromUserInput: inputUpdateFromUserInputMock,
	} = inputDefMock.mocks
	inputSummarizeForEditMock.mockImplementation((item: string) => `summarized ${item}`)


	it('takes name from inputDef', async () => {
		const def = optionalDef(inputDefMock, () => true)
		expect(def.name).toBe('Input Def')
	})

	describe('buildFromUserInput', () => {
		it('returns undefined when predicate not active', async () => {
			const checkIfActiveMock = jest.fn<OptionalDefPredicateFn>().mockReturnValue(false)
			const def = optionalDef(inputDefMock, checkIfActiveMock)

			expect(await def.buildFromUserInput()).toBe(undefined)

			expect(checkIfActiveMock).toHaveBeenCalledTimes(1)
			expect(checkIfActiveMock).toHaveBeenCalledWith(undefined)

			expect(inputBuildFromUserInputMock).toHaveBeenCalledTimes(0)
		})

		it('uses inputDef.buildFromUserInput when active', async () => {
			const checkIfActiveMock = jest.fn<OptionalDefPredicateFn>().mockReturnValue(true)
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
			const checkIfActiveMock = jest.fn<OptionalDefPredicateFn>()
			inputSummarizeForEditMock.mockReturnValueOnce('summarized value')
			const def = optionalDef(inputDefMock, checkIfActiveMock, { initiallyActive: true })

			expect(def.summarizeForEdit('value to summarize', ['context'])).toBe('summarized value')

			expect(inputSummarizeForEditMock).toHaveBeenCalledTimes(1)
			expect(inputSummarizeForEditMock).toHaveBeenCalledWith('value to summarize', ['context'])

			expect(checkIfActiveMock).toHaveBeenCalledTimes(0)
		})

		it('returns uneditable when not active', () => {
			const checkIfActiveMock = jest.fn<OptionalDefPredicateFn>()
			const def = optionalDef(inputDefMock, checkIfActiveMock, { initiallyActive: false })

			expect(def.summarizeForEdit('value to summarize')).toBe(uneditable)

			expect(checkIfActiveMock).toHaveBeenCalledTimes(0)
			expect(inputSummarizeForEditMock).toHaveBeenCalledTimes(0)
		})
	})

	describe('updateFromUserInput', () => {
		it('uses inputDef.updateFromUserInput when active', async () => {
			const checkIfActiveMock = jest.fn<OptionalDefPredicateFn>()
			inputUpdateFromUserInputMock.mockResolvedValueOnce('updated value')
			const def = optionalDef(inputDefMock, checkIfActiveMock, { initiallyActive: true })

			expect(await def.updateFromUserInput('value to update', ['context'])).toBe('updated value')

			expect(inputUpdateFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(inputUpdateFromUserInputMock).toHaveBeenCalledWith('value to update', ['context'])

			expect(checkIfActiveMock).toHaveBeenCalledTimes(0)
			expect(inputBuildFromUserInputMock).toHaveBeenCalledTimes(0)
		})

		it('uses inputDef.buildFromUserInput when no original value passed in', async () => {
			const checkIfActiveMock = jest.fn<OptionalDefPredicateFn>()
			const def = optionalDef(inputDefMock, checkIfActiveMock, { initiallyActive: true })
			inputBuildFromUserInputMock.mockResolvedValueOnce('new value')

			expect(await def.updateFromUserInput(undefined, ['context'])).toBe('new value')

			expect(inputBuildFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(inputBuildFromUserInputMock).toHaveBeenCalledWith(['context'])

			expect(checkIfActiveMock).toHaveBeenCalledTimes(0)
			expect(inputUpdateFromUserInputMock).toHaveBeenCalledTimes(0)
		})

		it('returns undefined when not active', async () => {
			const checkIfActiveMock = jest.fn<OptionalDefPredicateFn>()
			const def = optionalDef(inputDefMock, checkIfActiveMock, { initiallyActive: false })

			expect(await def.updateFromUserInput('value to update')).toBe(undefined)

			expect(checkIfActiveMock).toHaveBeenCalledTimes(0)
			expect(inputUpdateFromUserInputMock).toHaveBeenCalledTimes(0)
		})
	})

	describe('updateIfNeeded', () => {
		const inputDefUpdateIfNeededMock = jest.fn<Required<InputDefinition<string>>['updateIfNeeded']>()
		const inputDefWithUpdateIfNeededMock: InputDefinition<string> = {
			...inputDefMock,
			updateIfNeeded: inputDefUpdateIfNeededMock,
		}

		it('uses inputDef.updateIfNeeded when active and had been active', async () => {
			const checkIfActiveMock = jest.fn<OptionalDefPredicateFn>().mockReturnValue(true)
			inputDefUpdateIfNeededMock.mockResolvedValueOnce('updated value')
			const def = optionalDef(inputDefWithUpdateIfNeededMock, checkIfActiveMock, { initiallyActive: true })

			expect(await def.updateIfNeeded?.('original', 'initiating updated prop', ['context'])).toBe('updated value')

			expect(checkIfActiveMock).toHaveBeenCalledTimes(1)
			expect(checkIfActiveMock).toHaveBeenCalledWith(['context'])
			expect(inputDefUpdateIfNeededMock).toHaveBeenCalledTimes(1)
			expect(inputDefUpdateIfNeededMock).toHaveBeenCalledWith('original', 'initiating updated prop', ['context'])

			expect(inputBuildFromUserInputMock).toHaveBeenCalledTimes(0)
		})

		it('returns original when active and had been active and there is no `inputDef.updateIfNeeded`', async () => {
			const checkIfActiveMock = jest.fn<OptionalDefPredicateFn>().mockReturnValue(true)
			const def = optionalDef(inputDefMock, checkIfActiveMock, { initiallyActive: true })

			expect(await def.updateIfNeeded?.('original', 'initiating updated prop', ['context'])).toBe('original')

			expect(checkIfActiveMock).toHaveBeenCalledTimes(1)
			expect(checkIfActiveMock).toHaveBeenCalledWith(['context'])
			expect(inputDefUpdateIfNeededMock).toHaveBeenCalledTimes(0)
		})

		it('uses inputDef.buildFromUserInput if previously inactive', async () => {
			const checkIfActiveMock = jest.fn<OptionalDefPredicateFn>().mockReturnValue(true)
			inputBuildFromUserInputMock.mockResolvedValueOnce('newly entered value')
			const def = optionalDef(inputDefWithUpdateIfNeededMock, checkIfActiveMock, { initiallyActive: false })

			expect(await def.updateIfNeeded?.('original', 'initiating updated prop', ['context'])).toBe('newly entered value')

			expect(checkIfActiveMock).toHaveBeenCalledTimes(1)
			expect(checkIfActiveMock).toHaveBeenCalledWith(['context'])
			expect(inputBuildFromUserInputMock).toHaveBeenCalledTimes(1)
			expect(inputBuildFromUserInputMock).toHaveBeenCalledWith(['context'])

			expect(inputDefUpdateIfNeededMock).toHaveBeenCalledTimes(0)
		})

		it('returns undefined if not active', async () => {
			const checkIfActiveMock = jest.fn<OptionalDefPredicateFn>().mockReturnValue(false)
			inputBuildFromUserInputMock.mockResolvedValueOnce('delete this line!!!')
			const def = optionalDef(inputDefWithUpdateIfNeededMock, checkIfActiveMock)

			expect(await def.updateIfNeeded?.('original', 'initiating updated prop', ['context'])).toBe(undefined)

			expect(checkIfActiveMock).toHaveBeenCalledTimes(1)
			expect(checkIfActiveMock).toHaveBeenCalledWith(['context'])

			expect(inputDefUpdateIfNeededMock).toHaveBeenCalledTimes(0)
			expect(inputBuildFromUserInputMock).toHaveBeenCalledTimes(0)
		})
	})
})
