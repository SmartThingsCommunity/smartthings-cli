import {DeviceProfile, LocaleReference} from '@smartthings/core-sdk'

import { NestedSelectingAPICommand } from '@smartthings/cli-lib'


export default class DeviceProfileTranslationsDeleteCommand extends NestedSelectingAPICommand<DeviceProfile, LocaleReference> {
	static description = 'delete a device profile translation'

	static flags = NestedSelectingAPICommand.flags

	static args = [
		{
			name: 'id',
			description: 'Device profile UUID or number in the list',
		},
		{
			name: 'tag',
			description: 'the locale tag',
		},
	]

	static examples = [
		'$ smartthings deviceprofiles:translations:delete 3acbf2fc-6be2-4be0-aeb5-44759cbd66c2 en',
		'Device profile "3acbf2fc-6be2-4be0-aeb5-44759cbd66c2" translation "en" deleted',
		'',
		'$ smartthings deviceprofiles:translations:delete',
		'┌────┬─────────────────────┬─────────────┬──────────────────────────────────────┐',
		'│ #  │ Name                │ Status      │ Id                                   │',
		'├────┼─────────────────────┼─────────────┼──────────────────────────────────────┤',
		'│  1 │ Test Switch         │ DEVELOPMENT │ 58e73d0c-b5a5-4814-b344-c10f4ff357bb │',
		'│  2 │ Two Channel Outlet  │ DEVELOPMENT │ 3acbf2fc-6be2-4be0-aeb5-44759cbd66c2 │',
		'└────┴─────────────────────┴─────────────┴──────────────────────────────────────┘',
		'? Enter id or index 2',
		'┌───┬─────┐',
		'│ # │ Tag │',
		'├───┼─────┤',
		'│ 1 │ en  │',
		'│ 2 │ es  │',
		'└───┴─────┘',
		'? Enter id or index 1',
		'Device profile "3acbf2fc-6be2-4be0-aeb5-44759cbd66c2" translation "en" deleted',
	]

	primaryKeyName = 'id'
	sortKeyName = 'name'
	nestedPrimaryKeyName = 'tag'
	nestedSortKeyName = 'tag'
	listTableFieldDefinitions = ['name', 'status', 'id']
	nestedListTableFieldDefinitions = ['tag']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfileTranslationsDeleteCommand)
		await super.setup(args, argv, flags)

		await this.processNormally(
			args.id,
			args.tag,
			async () => await this.client.deviceProfiles.list(),
			async (id) => await this.client.deviceProfiles.listLocales(id),
			async (id, tag) => { await this.client.deviceProfiles.deleteTranslations(id, tag) },
			'Device profile {{id}} translation {{nestedId}} deleted')
	}
}
