import { Errors } from '@oclif/core'

import { CapabilityReference, CapabilityStatus } from '@smartthings/core-sdk'

import { APICommand, formatAndWriteItem, selectFromList, stringTranslateToId, TableGenerator } from '@smartthings/cli-lib'

import { chooseDevice } from '../../lib/commands/devices/devices-util'
import { chooseComponent } from './component-status'
import { prettyPrintAttribute } from './status'


export function buildTableOutput(tableGenerator: TableGenerator, capability: CapabilityStatus): string {
	const table = tableGenerator.newOutputTable({head: ['Attribute', 'Value']})

	for (const attributeName of Object.keys(capability)) {
		const attribute = capability[attributeName]
		table.push([
			attributeName,
			attribute.value !== null ?
				`${prettyPrintAttribute(attribute.value)}${attribute.unit ? ' ' + attribute.unit : ''}` : ''])
	}
	return table.toString()
}

export default class DeviceCapabilityStatusCommand extends APICommand {
	static description = "get the current status of all of a device capability's attributes"

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
		const { args, argv, flags } = await this.parse(DeviceCapabilityStatusCommand)
		await super.setup(args, argv, flags)

		const deviceId = await chooseDevice(this, args.id, { allowIndex: true })

		const device = await this.client.devices.get(deviceId)
		const componentName = await chooseComponent(this, args.component, device.components)

		const component = device.components?.find(it => it.id === componentName)
		const capabilities = component?.capabilities
		if (!capabilities) {
			throw new Errors.CLIError(`no capabilities found for component ${componentName} of device ${deviceId}`)
		}

		const config = {
			itemName: 'capability',
			primaryKeyName: 'id',
			sortKeyName: 'id',
			listTableFieldDefinitions: ['id'],
		}
		const listCapabilities = async (): Promise<CapabilityReference[]> => capabilities
		const preselectedCapabilityId = await stringTranslateToId(config, args.capability, listCapabilities)
		const capabilityId = await selectFromList(this, config, preselectedCapabilityId, listCapabilities)
		const capabilityStatus = await this.client.devices.getCapabilityStatus(deviceId, componentName, capabilityId)
		await formatAndWriteItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) }, capabilityStatus)
	}
}
