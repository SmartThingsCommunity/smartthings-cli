import { DeviceProfile, DeviceProfileRequest } from '@smartthings/core-sdk'
import { InputOutputAPICommand } from '@smartthings/cli-lib'
import Table from 'cli-table'

export default class DeviceProfileCreateCommand extends InputOutputAPICommand<DeviceProfileRequest, DeviceProfile> {
	static description = 'Create a new device profile'

	static flags = InputOutputAPICommand.flags

	static examples = [
		'$ smartthings deviceprofiles:create -i myprofile.json    #create a device profile from the JSON file definition',
		'$ smartthings deviceprofiles:create -i myprofile.yaml    #create a device profile from the YAML file definition',
	]

	protected buildTableOutput(data: DeviceProfile): string {
		const table: Table = this.newOutputTable({head: ['property','value']})
		table.push(['name', data.name])
		table.push(['id', data.id])
		table.push(['deviceType', data.metadata ? data.metadata.deviceType : ''])
		table.push(['mnmn', data.metadata ? data.metadata.mnmn : ''])
		table.push(['vid', data.metadata ? data.metadata.vid : ''])
		return table.toString()
	}

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
function cleanupRequest(deviceProfileRequest: any): DeviceProfileRequest {
	delete deviceProfileRequest.id
	delete deviceProfileRequest.status
	delete deviceProfileRequest.owner
	for (const component of deviceProfileRequest.components) {
		delete component.label
	}
	return deviceProfileRequest
}
