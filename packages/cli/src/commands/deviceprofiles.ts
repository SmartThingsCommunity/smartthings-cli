import { DeviceProfile } from '@smartthings/core-sdk'
import { ListableObjectOutputCommand } from '@smartthings/cli-lib'

export default class DeviceProfilesList extends ListableObjectOutputCommand<DeviceProfile, DeviceProfile> {
	static description = 'Lists all device profiles available in a user account or retrieves a single profile'

	static flags = ListableObjectOutputCommand.flags

	static args = [{
		name: 'id',
		description: 'Device profile to retrieve. Can be a UUID or the number of the profile in the list',
		required: false,
	}]

	static examples = [
		'$ smartthings deviceprofiles                      #list all device profiles',
		'$ smartthings deviceprofiles bb0fdc5-...-a8bd2ea  #show device profile with the specified UUID',
		'$ smartthings deviceprofiles 2                    #show the second device profile in the list',
		'$ smartthings deviceprofiles 3 -j                 #show the profile in JSON format',
		'$ smartthings deviceprofiles 5 -y                 #show the profile in YAML format',
		'$ smartthings deviceprofiles 4 -j -o profile.json #write the profile to the file "profile.json"',
	]

	protected primaryKeyName(): string { return 'id' }
	protected sortKeyName(): string { return 'name' }
	protected tableHeadings(): string[] { return ['name', 'status', 'id'] }

	protected buildObjectTableOutput(data: DeviceProfile): string {
		const table = this.newOutputTable({head: ['property','value']})
		table.push(['name', data.name])
		for (const comp of data.components) {
			table.push([`${comp.id} component`,  comp.capabilities ? comp.capabilities.map(it => it.id).join('\n') : ''])
		}
		table.push(['id', data.id])
		table.push(['deviceType', data.metadata ? data.metadata.deviceType : ''])
		table.push(['ocfDeviceType', data.metadata ? data.metadata.ocfDeviceType : ''])
		table.push(['mnmn', data.metadata ? data.metadata.mnmn : ''])
		table.push(['vid', data.metadata ? data.metadata.vid : ''])
		table.push(['status', data.status])
		return table.toString()
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfilesList)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => { return this.client.deviceProfiles.list() },
			(id) => { return this.client.deviceProfiles.get(id) },
		)
	}
}
