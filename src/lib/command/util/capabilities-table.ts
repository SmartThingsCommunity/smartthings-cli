import {
	type Capability,
	type CapabilityArgument,
} from '@smartthings/core-sdk'

import { type TableGenerator } from '../../table-generator.js'
import { attributeTypeDisplayString } from './capabilities-util.js'


export const buildTableOutput = (
		tableGenerator: TableGenerator, capability: Capability,
): string => {
	let output = `Capability: ${capability.name} (${capability.id})\n`
	if (capability.attributes && Object.keys(capability.attributes).length > 0) {
		output += '\n\nAttributes: \n'
		const table = tableGenerator.newOutputTable({ head: ['Name', 'Type', 'Setter'], isList: true })
		for (const name in capability.attributes) {
			const subItem = capability.attributes[name]
			table.push([
				name,
				attributeTypeDisplayString(subItem.schema.properties.value),
				subItem.setter || '',
			])
		}
		output += table.toString()
	}
	if (capability.commands && Object.keys(capability.commands).length > 0) {
		output += '\n\nCommands: \n'
		const table = tableGenerator.newOutputTable({ head: ['Name', 'Arguments'], isList: true })
		for (const name in capability.commands) {
			const subItem = capability.commands[name]
			table.push([
				name,
				subItem.arguments?.map((it: CapabilityArgument) => it.optional
					? `${it.name}: ${attributeTypeDisplayString(it.schema)} (optional)`
					: `${it.name}: ${attributeTypeDisplayString(it.schema)}`).join('\n') ?? '',
			])
		}
		output += table.toString()
	}
	return output
}
