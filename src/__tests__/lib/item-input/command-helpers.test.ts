import { jest } from '@jest/globals'

import inquirer from 'inquirer'

import type { Profile } from '../../../lib/cli-config.js'
import type { red } from '../../../lib/colors.js'
import type { cancelCommand } from '../../../lib/util.js'
import type { askForBoolean } from '../../../lib/user-query.js'
import {
	cancelAction,
	editAction,
	finishAction,
	type InputDefinition,
	previewJSONAction,
	previewYAMLAction,
} from '../../../lib/item-input/defs.js'
import type { OutputFormatter, jsonFormatter, yamlFormatter } from '../../../lib/command/output.js'
import type { BuildOutputFormatterFlags } from '../../../lib/command/output-builder.js'
import type {
	SmartThingsCommand,
	SmartThingsCommandFlags,
} from '../../../lib/command/smartthings-command.js'
import { buildInputDefMock } from '../../test-lib/input-type-mock.js'
import type { SimpleType } from '../../test-lib/simple-type.js'


const promptMock = jest.fn<typeof inquirer.prompt>()
jest.unstable_mockModule('inquirer', () => ({
	default: {
		prompt: promptMock,
		Separator: inquirer.Separator,
	},
}))

const redMock = jest.fn<typeof red>()
jest.unstable_mockModule('../../../lib/colors.js', () => ({
	red: redMock,
}))

const cancelCommandMock = jest.fn<typeof cancelCommand>()
	.mockImplementation(() => { throw Error('canceled') })
jest.unstable_mockModule('../../../lib/util.js', () => ({
	cancelCommand: cancelCommandMock,
}))

const askForBooleanMock = jest.fn<typeof askForBoolean>()
jest.unstable_mockModule('../../../lib/user-query.js', () => ({
	askForBoolean: askForBooleanMock,
}))

const jsonOutputFormatterMock = jest.fn<OutputFormatter<SimpleType>>()
	.mockReturnValue('formatted JSON')
const yamlOutputFormatterMock = jest.fn<OutputFormatter<SimpleType>>()
	.mockReturnValue('formatted YAML')
const jsonFormatterMock = jest.fn<typeof jsonFormatter<SimpleType>>()
	.mockReturnValue(jsonOutputFormatterMock)
const yamlFormatterMock = jest.fn<typeof yamlFormatter<SimpleType>>()
	.mockReturnValue(yamlOutputFormatterMock)
jest.unstable_mockModule('../../../lib/command/output.js', () => ({
	jsonFormatter: jsonFormatterMock,
	yamlFormatter: yamlFormatterMock,
}))

const buildCommandMock = (
		flags: Partial<SmartThingsCommandFlags & BuildOutputFormatterFlags> = {},
		profile: Profile = {},
): SmartThingsCommand<BuildOutputFormatterFlags> => ({
	flags: { profile: 'default', ...flags },
	cliConfig:
	{ profile },
} as unknown as SmartThingsCommand)
const commandMock = buildCommandMock()

const inputDefMock = buildInputDefMock<SimpleType>('Item-to-Input')
const {
	buildFromUserInput: buildFromUserInputMock,
	summarizeForEdit: summarizeForEditMock,
	updateFromUserInput: updateFromUserInputMock,
} = inputDefMock.mocks

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => true)


const {
	createFromUserInput,
	updateFromUserInput,
} = await import('../../../lib/item-input/command-helpers.js')


const simpleValue = { str: 'a string', num: 13 }
const updatedValue = { str: 'a new string', num: 15 }
const badInputValue = { str: 'a bad string', num: -1_000_000 }

describe('updateFromUserInput', () => {
	it('returns input when no further updates requested', async () => {
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, simpleValue, { dryRun: false }))
			.toStrictEqual(simpleValue)

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			message: 'Choose an action.',
			default: finishAction,
			choices: [
				{ name: 'Edit Item-to-Input.', value: editAction },
				{ name: 'Preview JSON.', value: expect.any(Symbol) },
				{ name: 'Preview YAML.', value: expect.any(Symbol) },
				{ name: 'Finish and update Item-to-Input.', value: finishAction },
				{ name: 'Cancel update of Item-to-Input.', value: cancelAction },
			],
		}))

		expect(buildFromUserInputMock).not.toHaveBeenCalled()
		expect(summarizeForEditMock).not.toHaveBeenCalled()
		expect(updateFromUserInputMock).not.toHaveBeenCalled()
	})

	it('uses "output" text when in dry-run mode', async () => {
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, simpleValue, { dryRun: true }))
			.toBe(simpleValue)

		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
			choices: expect.arrayContaining([
				{ name: 'Finish and output Item-to-Input.', value: finishAction },
			]),
		}))
	})

	it('uses specified finishVerb', async () => {
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(
			commandMock,
			inputDefMock,
			simpleValue,
			{ dryRun: false, finishVerb: 'create' },
		)).toBe(simpleValue)

		expect(promptMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			choices: expect.arrayContaining([
				{ name: 'Finish and create Item-to-Input.', value: finishAction },
			]),
		}))
	})

	it('allows editing from main menu', async () => {
		promptMock.mockResolvedValueOnce({ action: editAction })
		updateFromUserInputMock.mockResolvedValueOnce(updatedValue)
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, simpleValue, { dryRun: false }))
			.toBe(updatedValue)

		expect(promptMock).toHaveBeenCalledTimes(2)
		expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(simpleValue)
	})

	it('displays validation error and disables finish with validation errors', async () => {
		const validateFinalMock = jest.fn<Required<InputDefinition<SimpleType>>['validateFinal']>()
			.mockReturnValue(true)
			.mockReturnValueOnce('error text')
		redMock.mockReturnValueOnce('red error text')
		updateFromUserInputMock.mockResolvedValueOnce(updatedValue)

		const inputDefWithValidationMock: InputDefinition<SimpleType> = {
			...inputDefMock,
			validateFinal: validateFinalMock,
		}
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(
			commandMock,
			inputDefWithValidationMock,
			badInputValue,
			{ dryRun: false },
		)).toBe(updatedValue)

		expect(validateFinalMock).toHaveBeenCalledTimes(2)
		expect(validateFinalMock).toHaveBeenCalledWith(badInputValue)
		expect(validateFinalMock).toHaveBeenCalledWith(updatedValue)
		expect(redMock).toHaveBeenCalledExactlyOnceWith('error text')
		expect(consoleLogSpy).toHaveBeenCalledWith('red error text')
		expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(badInputValue)
		expect(promptMock).toHaveBeenCalledTimes(1)
	})

	it('allows cancelation with validation error', async () => {
		const validateFinalMock = jest.fn<Required<InputDefinition<SimpleType>>['validateFinal']>()
			.mockReturnValue('error text')
		redMock.mockReturnValueOnce('red error text')
		updateFromUserInputMock.mockResolvedValueOnce(cancelAction)

		const inputDefWithValidationMock: InputDefinition<SimpleType> = {
			...inputDefMock,
			validateFinal: validateFinalMock,
		}

		await expect(updateFromUserInput(
			commandMock,
			inputDefWithValidationMock,
			badInputValue,
			{ dryRun: false },
		)).rejects.toThrow('canceled')

		expect(validateFinalMock).toHaveBeenCalledExactlyOnceWith(badInputValue)
		expect(redMock).toHaveBeenCalledExactlyOnceWith('error text')
		expect(consoleLogSpy).toHaveBeenCalledWith('red error text')
		expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(badInputValue)
		expect(cancelCommandMock).toHaveBeenCalledTimes(1)

		expect(promptMock).toHaveBeenCalledTimes(0)
	})

	it('accepts cancelation of editing from main menu', async () => {
		promptMock.mockResolvedValueOnce({ action: editAction })
		updateFromUserInputMock.mockResolvedValueOnce(cancelAction)
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, simpleValue, { dryRun: false }))
			.toBe(simpleValue)

		expect(promptMock).toHaveBeenCalledTimes(2)
		expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(simpleValue)
	})

	it('allows previewing JSON', async () => {
		promptMock.mockResolvedValueOnce({ action: previewJSONAction })
		askForBooleanMock.mockResolvedValueOnce(false)
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, simpleValue, { dryRun: false }))
			.toBe(simpleValue)

		expect(promptMock).toHaveBeenCalledTimes(2)
		expect(jsonFormatterMock).toHaveBeenCalledExactlyOnceWith(4)
		expect(jsonOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(jsonOutputFormatterMock).toHaveBeenCalledWith(simpleValue)
		expect(askForBooleanMock).toHaveBeenCalledWith(
			'formatted JSON\n\nWould you like to edit further?',
			{ default: false },
		)
	})

	it('allows editing after preview', async () => {
		promptMock.mockResolvedValueOnce({ action: previewJSONAction })
		askForBooleanMock.mockResolvedValueOnce(true)
		updateFromUserInputMock.mockResolvedValueOnce(updatedValue)
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, simpleValue, { dryRun: false }))
			.toBe(updatedValue)

		expect(promptMock).toHaveBeenCalledTimes(2)
		expect(jsonFormatterMock).toHaveBeenCalledTimes(1)
		expect(jsonOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(simpleValue)
	})

	it('sticks to original upon cancelation after editing after preview', async () => {
		promptMock.mockResolvedValueOnce({ action: previewJSONAction })
		askForBooleanMock.mockResolvedValueOnce(true)
		updateFromUserInputMock.mockResolvedValueOnce(cancelAction)
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, simpleValue, { dryRun: false }))
			.toBe(simpleValue)

		expect(promptMock).toHaveBeenCalledTimes(2)
		expect(jsonFormatterMock).toHaveBeenCalledTimes(1)
		expect(jsonOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(simpleValue)
	})

	it('allows previewing YAML', async () => {
		promptMock.mockResolvedValueOnce({ action: previewYAMLAction })
		askForBooleanMock.mockResolvedValueOnce(false)
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, simpleValue, { dryRun: false }))
			.toBe(simpleValue)

		expect(promptMock).toHaveBeenCalledTimes(2)
		expect(yamlFormatterMock).toHaveBeenCalledExactlyOnceWith(2)
		expect(yamlOutputFormatterMock).toHaveBeenCalledExactlyOnceWith(simpleValue)
		expect(askForBooleanMock).toHaveBeenCalledWith(
			'formatted YAML\n\nWould you like to edit further?',
			{ default: false },
		)
	})

	it('accepts indent level from config', async () => {
		const commandMock = buildCommandMock({}, { indent: 13 })
		promptMock.mockResolvedValueOnce({ action: previewYAMLAction })
		askForBooleanMock.mockResolvedValueOnce(false)
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, simpleValue, { dryRun: false }))
			.toBe(simpleValue)

		expect(promptMock).toHaveBeenCalledTimes(2)
		expect(yamlFormatterMock).toHaveBeenCalledExactlyOnceWith(13)
		expect(yamlOutputFormatterMock).toHaveBeenCalledTimes(1)
	})

	it('accepts indent level from command line', async () => {
		const commandMock = buildCommandMock({ indent: 14 })
		promptMock.mockResolvedValueOnce({ action: previewJSONAction })
		promptMock.mockResolvedValueOnce({ editAgain: false })
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, simpleValue, { dryRun: false }))
			.toBe(simpleValue)

		expect(promptMock).toHaveBeenCalledTimes(3)
		expect(jsonFormatterMock).toHaveBeenCalledExactlyOnceWith(14)
		expect(jsonOutputFormatterMock).toHaveBeenCalledTimes(1)
	})

	it('command line indent overrides value from config', async () => {
		const commandMock = buildCommandMock({ indent: 15 }, { indent: 14 })
		promptMock.mockResolvedValueOnce({ action: previewYAMLAction })
		promptMock.mockResolvedValueOnce({ editAgain: false })
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, simpleValue, { dryRun: false }))
			.toBe(simpleValue)

		expect(promptMock).toHaveBeenCalledTimes(3)
		expect(yamlFormatterMock).toHaveBeenCalledExactlyOnceWith(15)
		expect(yamlOutputFormatterMock).toHaveBeenCalledTimes(1)
	})

	it('calls cancel when user cancels', async () => {
		promptMock.mockResolvedValueOnce({ action: cancelAction })

		await expect(updateFromUserInput(commandMock, inputDefMock, simpleValue, { dryRun: false }))
			.rejects.toThrow('canceled')

		expect(cancelCommandMock).toHaveBeenCalledTimes(1)
	})
})

describe('createFromUserInput', () => {
	it('calls buildFromUserInput and updateFromUserInput', async () => {
		buildFromUserInputMock.mockResolvedValueOnce(simpleValue)
		promptMock.mockResolvedValueOnce({ action: editAction })
		updateFromUserInputMock.mockResolvedValueOnce(updatedValue)
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await createFromUserInput(commandMock, inputDefMock, { dryRun: false }))
			.toStrictEqual(updatedValue)

		expect(buildFromUserInputMock).toHaveBeenCalledExactlyOnceWith()
		expect(promptMock).toHaveBeenCalledTimes(2)
		expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(simpleValue)
	})

	it('cancels when initial initial wizard mode is canceled', async () => {
		buildFromUserInputMock.mockResolvedValueOnce(cancelAction)

		await expect(createFromUserInput(commandMock, inputDefMock, { dryRun: false }))
			.rejects.toThrow('canceled')

		expect(buildFromUserInputMock).toHaveBeenCalledTimes(1)
		expect(cancelCommandMock).toHaveBeenCalledTimes(1)
	})
})
