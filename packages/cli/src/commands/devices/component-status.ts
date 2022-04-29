import { Component, ComponentStatus } from '@smartthings/core-sdk'

import { APICommand, chooseDevice, formatAndWriteItem, selectFromList, SelectingConfig,
	SmartThingsCommandInterface, stringTranslateToId, TableGenerator,
} from '@smartthings/cli-lib'

import { prettyPrintAttribute } from './status'


export function buildTableOutput(tableGenerator: TableGenerator, component: ComponentStatus): string {
	const table = tableGenerator.newOutputTable({head: ['Capability', 'Attribute', 'Value']})
	for (const capabilityName of Object.keys(component)) {
		const capability = component[capabilityName]
		for (const attributeName of Object.keys(capability)) {
			const attribute = capability[attributeName]
			table.push([
				capabilityName,
				attributeName,
				attribute.value !== null ?
					`${prettyPrintAttribute(attribute.value)}${attribute.unit ? ' ' + attribute.unit : ''}` : ''])
		}
	}
	return table.toString()
}

export async function chooseComponent(command: SmartThingsCommandInterface, componentFromArg?: string, components?: Component[]): Promise<string> {
	if (!components || components.length === 0) {
		return 'main'
	}

	const config: SelectingConfig<Component> = {
		itemName: 'component',
		primaryKeyName: 'id',
		sortKeyName: 'id',
		listTableFieldDefinitions: [{ label: 'Id', value: component => component.id === 'main' ? 'main (default)' : component.id }],
	}
	const listItems = async (): Promise<Component[]> => components
	const preselectedId = await stringTranslateToId(config, componentFromArg, listItems)
	return selectFromList(command, config, { preselectedId, listItems, autoChoose: true })
}

export default class DeviceComponentStatusCommand extends APICommand<typeof DeviceComponentStatusCommand.flags> {
	static description = "get the current status of a device component's attributes"

	static flags = {
		...APICommand.flags,
		...formatAndWriteItem.flags,
	}

	static args = [
		{
			name: 'id',
			description: 'the device id',
		},
		{
			name: 'component',
			description: 'the component id',
		},
	]

	async run(): Promise<void> {
		const deviceId = await chooseDevice(this, this.args.id, { allowIndex: true })

		const device = await this.client.devices.get(deviceId)
		const componentName = await chooseComponent(this, this.args.component, device.components)

		const componentStatus = await this.client.devices.getComponentStatus(deviceId, componentName)
		await formatAndWriteItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) }, componentStatus)
	}
}
