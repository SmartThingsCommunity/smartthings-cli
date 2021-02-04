import { APICommand, selectFromList } from '@smartthings/cli-lib'


export default class DeviceProfileTranslationsDeleteCommand extends APICommand {
	static description = 'delete a device profile translation'

	static flags = APICommand.flags

	static args = [
		{
			name: 'id',
			description: 'device profile UUID or number in the list',
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

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfileTranslationsDeleteCommand)
		await super.setup(args, argv, flags)


		const deviceProfileSelectConfig = {
			primaryKeyName: 'id',
			sortKeyName: 'name',
			listTableFieldDefinitions: ['name', 'status', 'id'],
		}
		const deviceProfileId = await selectFromList(this, deviceProfileSelectConfig, args.id,
			() => this.client.deviceProfiles.list(),
			'Select a device profile:')

		const localeTagSelectConfig = {
			primaryKeyName: 'tag',
			sortKeyName: 'tag',
			listTableFieldDefinitions: ['tag'],
		}
		const localeTag = await selectFromList(this, localeTagSelectConfig, args.tag,
			() => this.client.deviceProfiles.listLocales(deviceProfileId),
			'Select a locale:')

		await this.client.deviceProfiles.deleteTranslations(deviceProfileId, localeTag)
		this.log(`Translation ${localeTag} deleted from device profile ${deviceProfileId}.`)
	}
}
