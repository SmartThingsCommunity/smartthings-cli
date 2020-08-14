import { DeviceProfile, DeviceProfileRequest } from '@smartthings/core-sdk'

import { InputOutputAPICommand } from '@smartthings/cli-lib'

import { buildTableOutput } from '../deviceprofiles'


export default class DeviceProfileCreateCommand extends InputOutputAPICommand<DeviceProfileRequest, DeviceProfile> {
	static description = 'create a new device profile'

	static flags = InputOutputAPICommand.flags

	static examples = [
		'$ smartthings deviceprofiles:create -i myprofile.json    # create a device profile from the JSON file definition',
		'$ smartthings deviceprofiles:create -i myprofile.yaml    # create a device profile from the YAML file definition',
	]

	protected buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfileCreateCommand)
		await super.setup(args, argv, flags)

		this.processNormally((data) => {
			return this.client.deviceProfiles.create(cleanupRequest(data))
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
	delete deviceProfileRequest.restrictions
	if (deviceProfileRequest.components) {
		for (const component of deviceProfileRequest.components) {
			delete component.label
		}
	}
	return deviceProfileRequest
}
