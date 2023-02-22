import { CapabilityReference, CapabilityStatus } from '@smartthings/core-sdk'

import { APICommand, chooseComponent, chooseDevice, formatAndWriteItem, selectFromList, SelectFromListConfig, stringTranslateToId,
	TableGenerator } from '@smartthings/cli-lib'

import { prettyPrintAttribute } from '../../lib/commands/devices-util'


function buildTableOutput(tableGenerator: TableGenerator, capability: CapabilityStatus): string {
	const table = tableGenerator.newOutputTable({ head: ['Attribute', 'Value'] })

	for (const attributeName of Object.keys(capability)) {
		const attribute = capability[attributeName]
		table.push([
			attributeName,
			attribute.value !== null ?
				`${prettyPrintAttribute(attribute.value)}${attribute.unit ? ' ' + attribute.unit : ''}` : ''])
	}
	return table.toString()
}

export default class DeviceCapabilityStatusCommand extends APICommand<typeof DeviceCapabilityStatusCommand.flags> {
	static description = "get the current status of all of a device capability's attributes" +
		this.apiDocsURL('getDeviceStatusByCapability')

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
		{
			name: 'capability',
			description: 'the capability id',
		},
	]

	async run(): Promise<void> {
		const deviceId = await chooseDevice(this, this.args.id, { allowIndex: true })

		const device = await this.client.devices.get(deviceId)
		const componentName = await chooseComponent(this, this.args.component, device.components)

		const component = device.components?.find(it => it.id === componentName)
		const capabilities = component?.capabilities
		if (!capabilities) {
			this.error(`no capabilities found for component ${componentName} of device ${deviceId}`)
		}

		const config: SelectFromListConfig<CapabilityReference> = {
			itemName: 'capability',
			pluralItemName: 'capabilities',
			primaryKeyName: 'id',
			sortKeyName: 'id',
			listTableFieldDefinitions: ['id'],
		}
		const listItems = async (): Promise<CapabilityReference[]> => capabilities
		const preselectedId = await stringTranslateToId(config, this.args.capability, listItems)
		const capabilityId = await selectFromList(this, config, { preselectedId, listItems })
		const capabilityStatus = await this.client.devices.getCapabilityStatus(deviceId, componentName, capabilityId)
		await formatAndWriteItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) }, capabilityStatus)
	}
}
