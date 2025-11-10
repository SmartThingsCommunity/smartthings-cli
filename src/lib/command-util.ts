import { type CommandModule } from 'yargs'

import { commands } from '../commands/index.js'


export type SubCommand = {
	command: CommandModule
	relatedName: string
}
export type CommandStructure = {
	topics: string[]
	subCommands: SubCommand[]
}
export const findTopicsAndSubcommands = (commandName: string): CommandStructure => {
	const topicName = `${commandName}:`
	// Topics are commands that also have sub-commands.
	const topics = new Set<string>()
	const subCommands: SubCommand[] = []
	const related = (other: CommandModule): false | string => {
		if (!other.command) {
			return false
		}

		if (typeof other.command === 'string' && other.command.startsWith(topicName)) {
			return other.command
		}
		if (typeof other.command === 'object') {
			const match = other.command.find(name => name.startsWith(topicName))
			return match ?? false
		}

		return false
	}
	for (const other of commands) {
		const relatedCommandCommand = related(other)
		if (relatedCommandCommand) {
			const relatedCommandName = relatedCommandCommand.split(' ')[0]
			const subPart = relatedCommandName.slice(topicName.length)
			if (subPart.indexOf(':') !== -1) {
				// A sub-command of a command. Grab the first part for a topic.
				topics.add(`${topicName}:${subPart.split(':')[0]}`)
			} else {
				subCommands.push({ command: other, relatedName: relatedCommandName })
			}
		}
	}
	return { topics: (topics.size ? [...topics] : []).sort(), subCommands }
}
