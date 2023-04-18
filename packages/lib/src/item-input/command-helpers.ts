import inquirer, { ChoiceCollection } from 'inquirer'

import { jsonFormatter, OutputFormatter, yamlFormatter } from '../output'
import { SmartThingsCommandInterface } from '../smartthings-command'
import {
	cancelAction,
	editAction,
	editOption,
	finishAction,
	InputDefinition,
	previewJSONAction,
	previewYAMLAction,
} from './defs'


export type CreateFromUserInputOptions = {
	dryRun: boolean
}

export const updateFromUserInput = async <T extends object>(command: SmartThingsCommandInterface, inputDefinition: InputDefinition<T>, previousValue: T, options: CreateFromUserInputOptions): Promise<T> => {
	let retVal = previousValue

	const preview = async (formatter: (indent: number) => OutputFormatter<T>): Promise<void> => {
		// TODO: this should probably be moved to someplace more common
		const indent = command.flags.indent ?? command.cliConfig.profile.indent ?? (formatter === yamlFormatter ? 2 : 4)
		const output = formatter(indent)(retVal)
		const editAgain = (await inquirer.prompt({
			type: 'confirm',
			name: 'editAgain',
			message: output + '\n\nWould you like to edit further?',
			default: false,
		})).editAgain as boolean
		if (editAgain) {
			const answer = await inputDefinition.updateFromUserInput(retVal)
			if (answer !== cancelAction) {
				retVal = answer
			}
		}
	}

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const choices: ChoiceCollection = [
			editOption(inputDefinition.name),
			{ name: 'Preview JSON.', value: previewJSONAction },
			{ name: 'Preview YAML.', value: previewYAMLAction },
			{ name: `Finish and ${options.dryRun ? 'output' : 'create'} ${inputDefinition.name}.`, value: finishAction },
			{ name: `Cancel creating ${inputDefinition.name}.`, value: cancelAction },
		]

		const action = (await inquirer.prompt({
			type: 'list',
			name: 'action',
			message: `Create ${inputDefinition.name}.`,
			choices,
			default: finishAction,
		})).action

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
			command.cancel()
		}
	}
}

/**
 * Convenience method that makes it easy to use an input definition to create an object in a
 * command's `getInputFromUser` method.
 */
export const createFromUserInput = async <T extends object>(command: SmartThingsCommandInterface, inputDefinition: InputDefinition<T>, options: CreateFromUserInputOptions): Promise<T> => {
	const wizardResult = await inputDefinition.buildFromUserInput()
	if (wizardResult === cancelAction) {
		command.cancel()
	}

	return updateFromUserInput(command, inputDefinition, wizardResult, options)
}
