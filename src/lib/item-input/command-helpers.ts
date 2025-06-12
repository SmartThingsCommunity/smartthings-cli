import { select } from '@inquirer/prompts'

import { red } from '../colors.js'
import { booleanInput } from '../user-query.js'
import {
	cancelAction,
	type Choice,
	editAction,
	editOption,
	finishAction,
	type InputDefinition,
	previewJSONAction,
	previewYAMLAction,
} from './defs.js'
import { cancelCommand } from '../util.js'
import { jsonFormatter, OutputFormatter, yamlFormatter } from '../command/output.js'
import { type BuildOutputFormatterFlags } from '../command/output-builder.js'
import { type SmartThingsCommand } from '../command/smartthings-command.js'


export type UpdateFromUserInputOptions = {
	/**
	 * Set this to true to use "output" for the finish verb. The value passed here normally comes
	 * from the `dry-run` flag for commands that use `updateFromUserInput`.
	 */
	dryRun: boolean

	/**
	 * The verb to use when indicating completion. The default is 'update'.
	 */
	finishVerb?: 'create' | 'update'
}

export const updateFromUserInput = async <T extends object>(
	command: SmartThingsCommand<BuildOutputFormatterFlags>,
	inputDefinition: InputDefinition<T>,
	previousValue: T,
	options: UpdateFromUserInputOptions,
): Promise<T> => {
	let retVal = previousValue

	const preview = async (formatter: (indent: number) => OutputFormatter<T>): Promise<void> => {
		// TODO: this should probably be moved to someplace more common
		const indent = command.flags.indent
			?? (command.cliConfig.profile.indent as number | undefined)
			?? (formatter === yamlFormatter ? 2 : 4)
		const output = formatter(indent)(retVal)

		const editAgain = await booleanInput(
			output + '\n\nWould you like to edit further?',
			{ default: false },
		)
		if (editAgain) {
			const answer = await inputDefinition.updateFromUserInput(retVal)
			if (answer !== cancelAction) {
				retVal = answer
			}
		}
	}

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const validationResult = inputDefinition.validateFinal
			? inputDefinition.validateFinal(retVal)
			: true
		if (validationResult !== true) {
			console.log(red(validationResult))
			const answer = await inputDefinition.updateFromUserInput(retVal)
			if (answer === cancelAction) {
				return cancelCommand()
			}
			retVal = answer
			continue
		}
		const finishVerb = options.dryRun ? 'output' : (options.finishVerb ?? 'update')
		const finishNoun = options.finishVerb === 'create' ? 'creation' : 'update'
		const choices: Choice<T | symbol>[] = [
			editOption(inputDefinition.name),
			{ name: 'Preview JSON.', value: previewJSONAction },
			{ name: 'Preview YAML.', value: previewYAMLAction },
			{
				name: `Finish and ${finishVerb} ${inputDefinition.name}.`,
				value: finishAction,
			},
			{
				name: `Cancel ${finishNoun} of ${inputDefinition.name}.`,
				value: cancelAction,
			},
		]

		const action = await select({ message: 'Choose an action.', choices, default: finishAction })

		if (action === editAction) {
			const answer = await inputDefinition.updateFromUserInput(retVal)
			if (answer !== cancelAction) {
				retVal = answer
			}
		} else if (action === previewJSONAction) {
			await preview(jsonFormatter)
		} else if (action === previewYAMLAction) {
			await preview(yamlFormatter)
		} else if (action === finishAction) {
			return retVal
		} else if (action === cancelAction) {
			cancelCommand()
		}
	}
}

/**
 * Same as `UpdateFromUserInputOptions` but as used in `createFromUserInput`, the default
 * `finishVerb` is `create` instead of `update`.
 */
export type CreateFromUserInputOptions = UpdateFromUserInputOptions

/**
 * Convenience method that makes it easy to use an input definition to create an object in a
 * command's `getInputFromUser` method.
 */
export const createFromUserInput = async <T extends object>(
	command: SmartThingsCommand,
	inputDefinition: InputDefinition<T>,
	options: CreateFromUserInputOptions,
): Promise<T> => {
	const wizardResult = await inputDefinition.buildFromUserInput()
	if (wizardResult === cancelAction) {
		return cancelCommand()
	}
	return updateFromUserInput(
		command,
		inputDefinition,
		wizardResult,
		{ finishVerb: 'create', ...options },
	)
}
