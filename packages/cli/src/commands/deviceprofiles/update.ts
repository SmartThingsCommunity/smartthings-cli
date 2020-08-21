import { DeviceProfile, DeviceProfileRequest } from '@smartthings/core-sdk'

import {APICommand, SelectingInputOutputAPICommand} from '@smartthings/cli-lib'
import {DeviceDefinitionRequest} from './view'


export function buildTableOutput(this: APICommand, data: DeviceProfile): string {
	const table = this.tableGenerator.newOutputTable()
	table.push(['Name', data.name])
	for (const comp of data.components) {
		table.push([`${comp.id} component`,  comp.capabilities ? comp.capabilities.map(it => it.id).join('\n') : ''])
	}
	table.push(['Id', data.id])
	table.push(['Device Type', data.metadata?.deviceType ?? ''])
	table.push(['OCF Device Type', data.metadata?.ocfDeviceType ?? ''])
	table.push(['mnmn', data.metadata?.mnmn ?? ''])
	table.push(['vid', data.metadata?.vid ?? ''])
	table.push(['Status', data.status])
	return table.toString()
}

export default class DeviceProfileUpdateCommand extends SelectingInputOutputAPICommand<DeviceDefinitionRequest, DeviceProfile, DeviceProfile> {
	static description = 'update a device profile'

	static flags = SelectingInputOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'device profile UUID or number in the list',
	}]

	primaryKeyName = 'id'
	sortKeyName = 'name'
	listTableFieldDefinitions = ['name', 'status', 'id']

	protected buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfileUpdateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(args.id,
			() => { return this.client.deviceProfiles.list() },
			async (id, data) => {
				if (data.view) {
					throw new Error('Input contains "view" property. Use deviceprofiles:view:update instead.')
				}

				return this.client.deviceProfiles.update(id, cleanupRequest(data))
			})
	}
}

// Cleanup is done so that the result of a device profile get can be modified and
// used in an update operation without having to delete the status, owner, and
// component name fields, which aren't accepted in the update API call.
export function cleanupRequest(deviceProfileRequest: Partial<DeviceProfile & { restrictions: unknown }>): DeviceProfileRequest {
	delete deviceProfileRequest.id
	delete deviceProfileRequest.status
	delete deviceProfileRequest.owner
	delete deviceProfileRequest.name
	if (deviceProfileRequest.components) {
		for (const component of deviceProfileRequest.components) {
			delete component.label
		}
	}
	delete deviceProfileRequest.restrictions

	return deviceProfileRequest
}
