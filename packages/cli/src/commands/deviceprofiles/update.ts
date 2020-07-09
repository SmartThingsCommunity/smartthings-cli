import { DeviceProfile, DeviceProfileRequest } from '@smartthings/core-sdk'

import { SelectingInputOutputAPICommand } from '@smartthings/cli-lib'

import { buildTableOutput } from '../devicedefs'


export default class DeviceProfileUpdateCommand extends SelectingInputOutputAPICommand<DeviceProfileRequest, DeviceProfile, DeviceProfile> {
	static description = 'update a device profile'

	static flags = SelectingInputOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'device profile UUID or number in the list',
	}]

	primaryKeyName = 'id'
	sortKeyName = 'name'

	protected buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfileUpdateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(args.id,
			() => { return this.client.deviceProfiles.list() },
			async (id, data) => {
				return this.client.deviceProfiles.update(id, cleanupRequest(data))
			})
	}
}

// Cleanup is done so that the result of a device profile get can be modified and
// used in an update operation without having to delete the status, owner, and
// component name fields, which aren't accepted in the update API call.
export function cleanupRequest(deviceProfileRequest: Partial<DeviceProfile>): DeviceProfileRequest {
	delete deviceProfileRequest.id
	delete deviceProfileRequest.status
	delete deviceProfileRequest.owner
	delete deviceProfileRequest.name
	if (deviceProfileRequest.components) {
		for (const component of deviceProfileRequest.components) {
			delete component.label
		}
	}
	// @ts-ignore
	delete deviceProfileRequest.restrictions

	return deviceProfileRequest
}
