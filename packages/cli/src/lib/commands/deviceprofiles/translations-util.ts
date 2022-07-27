import { DeviceProfileTranslations } from '@smartthings/core-sdk'

import { TableGenerator } from '@smartthings/cli-lib'


export const buildTableOutput = (tableGenerator: TableGenerator, data: DeviceProfileTranslations): string => {
	let result = `Tag: ${data.tag}`
	if (data.components) {
		const table = tableGenerator.newOutputTable({ head: ['Component', 'Label', 'Description'] })
		for (const name of Object.keys(data.components)) {
			const component = data.components[name]
			table.push([name, component.label, component.description || ''])
		}
		result += '\n' + table.toString()
	}
	return result
}
