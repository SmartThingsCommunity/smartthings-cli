import { AttributeState, Device, DeviceHealth, DeviceStatus } from '@smartthings/core-sdk'

import { TableGenerator, WithNamedRoom } from '@smartthings/cli-lib'


export type DeviceWithLocation = Device & { location?: string }

export const buildStatusTableOutput = (tableGenerator: TableGenerator, data: DeviceStatus): string => {
	let output = ''
	if (data.components) {
		const componentIds = Object.keys(data.components)
		for (const componentId of componentIds) {
			const table = tableGenerator.newOutputTable({ head: ['Capability', 'Attribute', 'Value'] })
			if (componentIds.length > 1) {
				output += `\n${componentId} component\n`
			}
			const component = data.components[componentId]
			for (const capabilityName of Object.keys(component)) {
				const capability = component[capabilityName]
				for (const attributeName of Object.keys(capability)) {
					const attribute = capability[attributeName]
					table.push([
						capabilityName,
						attributeName,
						prettyPrintAttribute(attribute),
					])
				}
			}
			output += table.toString()
			output += '\n'
		}
	}
	return output
}
