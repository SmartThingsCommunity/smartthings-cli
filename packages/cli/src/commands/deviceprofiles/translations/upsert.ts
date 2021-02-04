import {DeviceProfile, DeviceProfileTranslations} from '@smartthings/core-sdk'
import {SelectingInputOutputAPICommand} from '@smartthings/cli-lib'

import {buildTableOutput} from '../translations'


export default class DeviceProfileTranslationsUpsertCommand extends SelectingInputOutputAPICommand<DeviceProfileTranslations, DeviceProfileTranslations, DeviceProfile> {
	static description = 'create or update a device profile translation'

	static flags = SelectingInputOutputAPICommand.flags

	static args = [
		{
			name: 'id',
			description: 'UUID or the number of the profile from list',
		},
	]

	static examples = [
		'$ smartthings deviceprofiles:translations:upsert 3acbf2fc-6be2-4be0-aeb5-44759cbd66c2 -i en.yaml',
		'tag: en',
		'components:',
		'  main:',
		'    label: Main Power',
		'    description: Controls power to all outlets',
		'  outlet1:',
		'    label: Outlet One',
		'    description: Switchable outlet 1 power',
		'  outlet2:',
		'    label: Outlet two',
		'    description: Switchable outlet 1 power',
		'',
		'$ smartthings deviceprofiles:translations:upsert -i en.yaml',
		'┌────┬─────────────────────┬─────────────┬──────────────────────────────────────┐',
		'│ #  │ Name                │ Status      │ Id                                   │',
		'├────┼─────────────────────┼─────────────┼──────────────────────────────────────┤',
		'│  1 │ Test Switch         │ DEVELOPMENT │ 58e73d0c-b5a5-4814-b344-c10f4ff357bb │',
		'│  2 │ Two Channel Outlet  │ DEVELOPMENT │ 3acbf2fc-6be2-4be0-aeb5-44759cbd66c2 │',
		'└────┴─────────────────────┴─────────────┴──────────────────────────────────────┘',
		'? Enter id or index 2',
		'tag: en',
		'components:',
		'  main:',
		'    label: Main Power',
		'    description: Controls power to all outlets',
		'  outlet1:',
		'    label: Outlet One',
		'    description: Switchable outlet 1 power',
		'  outlet2:',
		'    label: Outlet two',
		'    description: Switchable outlet 1 power',
	]

	primaryKeyName = 'id'
	sortKeyName = 'name'

	protected listTableFieldDefinitions = ['name', 'status', 'id']

	protected buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfileTranslationsUpsertCommand)
		await super.setup(args, argv, flags)

		const idOrIndex = args.version
			? { id: args.id, version: args.version }
			: args.id
		await this.processNormally(idOrIndex,
			() => this.client.deviceProfiles.list(),
			async (id, translations) => {
				return this.client.deviceProfiles.upsertTranslations(id, translations)
			})
	}
}
