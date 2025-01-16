import { type CapabilityLocalization } from '@smartthings/core-sdk'

import { type TableGenerator } from '../../table-generator.js'


export function buildTableOutput(tableGenerator: TableGenerator, data: CapabilityLocalization): string {
	let result = `Tag: ${data.tag}`
	if (data.attributes) {
		const table = tableGenerator.newOutputTable({ head: ['Name', 'Label', 'Description', 'Template'] })
		for (const name of Object.keys(data.attributes)) {
			const attr = data.attributes[name]
			table.push([name, attr.label, attr.description, attr.displayTemplate])
			if (attr.i18n?.value) {
				for (const key of Object.keys(attr.i18n.value)) {
					const entry = attr.i18n.value[key]
					table.push([
						`${name}.${key}`,
						entry?.label,
						entry?.description,
						'',
					])
				}
			}
		}
		result += '\n\nAttributes:\n' + table.toString()
	}
	if (data.commands) {
		const table = tableGenerator.newOutputTable({ head: ['Name', 'Label', 'Description'] })
		for (const name of Object.keys(data.commands)) {
			const cmd = data.commands[name]
			table.push([name, cmd.label, cmd.description])
			if (cmd.arguments) {
				for (const key of Object.keys(cmd.arguments)) {
					const entry = cmd.arguments[key]
					table.push([
						`${name}.${key}`,
						entry?.label,
						entry?.description,
					])
				}
			}
		}
		result += '\n\nCommands:\n' + table.toString()
	}
	return result
}
