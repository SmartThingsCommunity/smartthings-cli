import { Errors } from '@oclif/core'

import { DeviceProfile } from '@smartthings/core-sdk'

import { ActionFunction, APIOrganizationCommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { buildTableOutputWithoutPreferences, chooseDeviceProfile, cleanupDeviceProfileRequest } from '../../lib/commands/deviceprofiles-util'
import { DeviceDefinitionRequest } from '../../lib/commands/deviceprofiles/view-util'


export default class DeviceProfileUpdateCommand extends APIOrganizationCommand<typeof DeviceProfileUpdateCommand.flags> {
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
		const id = await chooseDeviceProfile(this, this.args.id)
		const executeUpdate: ActionFunction<void, DeviceDefinitionRequest, DeviceProfile> = async (_, data) => {
			if (data.view) {
				throw new Errors.CLIError('Input contains "view" property. Use deviceprofiles:view:update instead.')
			}

			return this.client.deviceProfiles.update(id, cleanupDeviceProfileRequest(data))
		}
		await inputAndOutputItem(this, { buildTableOutput: data => buildTableOutputWithoutPreferences(this.tableGenerator, data) }, executeUpdate)
	}
}
