import { getBorderCharacters, table } from 'table'

import { findTopicsAndSubcommands } from './command-util.js'


const toURL = (nameOrURL: string): string => nameOrURL.startsWith('http')
	? nameOrURL
	: `https://developer.smartthings.com/docs/api/public/#operation/${nameOrURL}`

export const apiDocsURL = (names: string | string[]): string => 'For API information, see:\n  ' +
	(typeof names === 'string' ? [names] : names).map(name => toURL(name)).join('\n  ')

export const itemInputHelpText = (...namesOrURLs: string[]): string =>
	'More information can be found at:\n  ' + namesOrURLs.map(nameOrURL => toURL(nameOrURL)).join('\n  ')

export type BuildEpilogOptions = {
	command: string
	apiDocs?: string | string[]
	notes?: string | string[]
	formattedNotes?: string
}
export const buildEpilog = (options: BuildEpilogOptions): string => {
	const commandName = options.command.split(' ')[0]
	const { topics, subCommands } = findTopicsAndSubcommands(commandName)

	const parts: string[] = []
	if (options.notes || options.formattedNotes) {
		const notesArray = (typeof options.notes === 'string' ? [options.notes] : [...(options.notes ?? [])])
			.map(note => `  ${note}`)
		if (options.formattedNotes) {
			notesArray.push(options.formattedNotes)
		}
		parts.push('Notes:\n' + notesArray.join('\n'))
	}
	if (options.apiDocs) {
		parts.push(apiDocsURL(options.apiDocs))
	}
	if (topics.length) {
		parts.push('Topics:\n' + topics.map(topic => `  ${topic}`).join('\n'))
	}
	if (subCommands.length) {
		const data = subCommands.map(subCommand => [`  ${subCommand.relatedName}`, subCommand.command.describe])
		parts.push('Sub-Commands:\n' + table(data, {
			border: getBorderCharacters('void'),
			columnDefault: {
				paddingLeft: 0,
				paddingRight: 1,
			},
			drawHorizontalLine: () => false,
		}))
	}
	return parts.join('\n\n')
}
