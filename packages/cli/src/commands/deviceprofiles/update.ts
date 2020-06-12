import { DeviceProfile, DeviceProfileRequest } from '@smartthings/core-sdk'

import { InputOutputAPICommand } from '@smartthings/cli-lib'

import { buildTableOutput } from '../deviceprofiles'


export default class DeviceProfileUpdateCommand extends InputOutputAPICommand<DeviceProfileRequest, DeviceProfile> {
	static description = 'update a device profile'

	static flags = InputOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'device profile UUID or number in the list',
		required: true,
	}]

	primaryKeyName = 'id'
	sortKeyName = 'name'

	protected buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfileUpdateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(data => { return this.client.deviceProfiles.update(args.id, cleanupRequest(data)) })
	}
}

// Cleanup is done so that the result of a device profile get can be modified and
// used in an update operation without having to delete the status, owner, and
// component name fields, which aren't accepted in the update API call.
function cleanupRequest(deviceProfileRequest: Partial<DeviceProfile>): DeviceProfileRequest {
	delete deviceProfileRequest.id
	delete deviceProfileRequest.status
	delete deviceProfileRequest.owner
	delete deviceProfileRequest.name
	if (deviceProfileRequest.components) {
		for (const component of deviceProfileRequest.components) {
			delete component.label
		}
	}
	return deviceProfileRequest
}
