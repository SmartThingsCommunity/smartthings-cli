import { CLIError } from '@oclif/errors'

import { DeviceProfile, DeviceProfileRequest } from '@smartthings/core-sdk'

import { ActionFunction, APIOrganizationCommand, inputAndOutputItem, TableGenerator } from '@smartthings/cli-lib'

import { chooseDeviceProfile } from '../deviceprofiles'
import { DeviceDefinitionRequest } from './view'


export function buildTableOutput(tableGenerator: TableGenerator, data: DeviceProfile): string {
	const table = tableGenerator.newOutputTable()
	table.push(['Name', data.name])
	for (const comp of data.components) {
		table.push([`${comp.id} component`,  comp.capabilities ? comp.capabilities.map(it => it.id).join('\n') : ''])
	}
	table.push(['Id', data.id])
	table.push(['Device Type', data.metadata?.deviceType ?? ''])
	table.push(['OCF Device Type', data.metadata?.ocfDeviceType ?? ''])
	table.push(['Manufacturer Name', data.metadata?.mnmn ?? ''])
	table.push(['Presentation ID', data.metadata?.vid ?? ''])
	table.push(['Status', data.status])
	return table.toString()
}

export default class DeviceProfileUpdateCommand extends APIOrganizationCommand {
	static description = 'update a device profile'

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'device profile UUID or number in the list',
	}]

	static aliases = ['device-profiles:update']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfileUpdateCommand)
		await super.setup(args, argv, flags)

		const id = await chooseDeviceProfile(this, args.id)
		const executeUpdate: ActionFunction<void, DeviceDefinitionRequest, DeviceProfile> = async (_, data) => {
			if (data.view) {
				throw new CLIError('Input contains "view" property. Use deviceprofiles:view:update instead.')
			}

			return this.client.deviceProfiles.update(id, cleanupRequest(data))
		}
		await inputAndOutputItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) }, executeUpdate)
	}
}

// Cleanup is done so that the result of a device profile get can be modified and
// used in an update operation without having to delete the status, owner, and
// component name fields, which aren't accepted in the update API call.
export function cleanupRequest(deviceProfileRequest: Partial<DeviceProfile & { restrictions: unknown }>): DeviceProfileRequest {
	delete deviceProfileRequest.id
	delete deviceProfileRequest.status
	delete deviceProfileRequest.name
	if (deviceProfileRequest.components) {
		for (const component of deviceProfileRequest.components) {
			delete component.label
		}
	}
	delete deviceProfileRequest.restrictions

	return deviceProfileRequest
}
