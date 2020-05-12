import { DeviceProfile, DeviceProfileRequest } from '@smartthings/core-sdk'
import { ListableObjectInputOutputCommand } from '@smartthings/cli-lib'

export default class DeviceProfileUpdateCommand extends ListableObjectInputOutputCommand<DeviceProfile, DeviceProfile, DeviceProfileRequest> {
	static description = 'Update a device profile'

	static flags = ListableObjectInputOutputCommand.flags

	static args = [{
		name: 'id',
		description: 'Device profile UUID or number in the list',
		required: true,
	}]

	protected primaryKeyName(): string { return 'id' }
	protected sortKeyName(): string { return 'name' }

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfileUpdateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => { return this.client.deviceProfiles.list() },
			(id, data) => {
				return this.client.deviceProfiles.update(id, cleanupRequest(data))
			},
		)
	}
}

// Cleanup is done so that the result of a device profile get can be modified and
// used in an update operation without having to delete the status, owner, and
// component name fields, which aren't accepted in the update API call.
function cleanupRequest(deviceProfileRequest: any): DeviceProfileRequest {
	delete deviceProfileRequest.id
	delete deviceProfileRequest.status
	delete deviceProfileRequest.owner
	delete deviceProfileRequest.name
	for (const component of deviceProfileRequest.components) {
		delete component.label
	}
	return deviceProfileRequest
}
