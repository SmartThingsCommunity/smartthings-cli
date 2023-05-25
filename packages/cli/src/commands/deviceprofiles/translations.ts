import { Flags } from '@oclif/core'

import { DeviceProfileTranslations, LocaleReference } from '@smartthings/core-sdk'

import { APIOrganizationCommand, OutputItemOrListConfig, outputItemOrList } from '@smartthings/cli-lib'
import { chooseDeviceProfile } from '../../lib/commands/deviceprofiles-util.js'
import { buildTableOutput } from '../../lib/commands/deviceprofiles/translations-util.js'


export default class DeviceProfileTranslationsCommand extends APIOrganizationCommand<typeof DeviceProfileTranslationsCommand.flags> {
	static description = 'get list of locales supported by the device profiles'

	static flags = {
		...APIOrganizationCommand.flags,
		...outputItemOrList.flags,
		verbose: Flags.boolean({
			description: 'include list of locales in table output',
			char: 'v',
		}),
	}

	static args = [
		{
			name: 'id',
			description: 'UUID or the number of the profile from list',
		},
		{
			name: 'tag',
			description: 'the locale tag or number of the tag from list',
		},
	]

	static examples = [
		'$ smartthings deviceprofiles:translations',
		'┌────┬─────────────────────┬─────────────┬──────────────────────────────────────┐',
		'│ #  │ Name                │ Status      │ Id                                   │',
		'├────┼─────────────────────┼─────────────┼──────────────────────────────────────┤',
		'│  1 │ Test Switch         │ DEVELOPMENT │ 58e73d0c-b5a5-4814-b344-c10f4ff357bb │',
		'│  2 │ Two Channel Outlet  │ DEVELOPMENT │ 3acbf2fc-6be2-4be0-aeb5-44759cbd66c2 │',
		'└────┴─────────────────────┴─────────────┴──────────────────────────────────────┘',
		'? Select a Device Profile. 2',
		'┌───┬─────┐',
		'│ # │ Tag │',
		'├───┼─────┤',
		'│ 1 │ en  │',
		'│ 2 │ es  │',
		'└───┴─────┘',
		'',
		'$ smartthings deviceprofiles:translations -v',
		'┌────┬─────────────────────┬─────────────┬──────────────────────────────────────┬─────────┐',
		'│ #  │ Name                │ Status      │ Id                                   │ Locales │',
		'├────┼─────────────────────┼─────────────┼──────────────────────────────────────┼─────────┤',
		'│  1 │ Test Switch         │ DEVELOPMENT │ 58e73d0c-b5a5-4814-b344-c10f4ff357bb │         │',
		'│  2 │ Two Channel Outlet  │ DEVELOPMENT │ 3acbf2fc-6be2-4be0-aeb5-44759cbd66c2 │ en, es  │',
		'└────┴─────────────────────┴─────────────┴──────────────────────────────────────┴─────────┘',
		'? Select a Device Profile. 2',
		'┌───┬─────┐',
		'│ # │ Tag │',
		'├───┼─────┤',
		'│ 1 │ en  │',
		'│ 2 │ es  │',
		'└───┴─────┘',
		'',
		'$ smartthings deviceprofiles:translations 2',
		'$ smartthings deviceprofiles:translations 3acbf2fc-6be2-4be0-aeb5-c10f4ff357bb',
		'┌───┬─────┐',
		'│ # │ Tag │',
		'├───┼─────┤',
		'│ 1 │ en  │',
		'│ 2 │ es  │',
		'└───┴─────┘',
		'',
		'$ smartthings deviceprofiles:translations 2 2',
		'$ smartthings deviceprofiles:translations 2 en',
		'$ smartthings deviceprofiles:translations 3acbf2fc-6be2-4be0-aeb5-44759cbd66c2 en',
		'Tag: en',
		'┌───────────┬────────────┬───────────────────────────────┐',
		'│ Component │ Label      │ Description                   │',
		'├───────────┼────────────┼───────────────────────────────┤',
		'│ main      │ Main Power │ Controls power to all outlets │',
		'│ outlet1   │ Outlet One │ Switchable outlet 1 power     │',
		'│ outlet2   │ Outlet two │ Switchable outlet 1 power     │',
		'└───────────┴────────────┴───────────────────────────────┘',
	]

	async run(): Promise<void> {
		const deviceProfileId = await chooseDeviceProfile(this, this.args.id, { verbose: this.flags.verbose, allowIndex: true })

		const config: OutputItemOrListConfig<DeviceProfileTranslations, LocaleReference> = {
			primaryKeyName: 'tag',
			sortKeyName: 'tag',
			buildTableOutput: data => buildTableOutput(this.tableGenerator, data),
			listTableFieldDefinitions: ['tag'],
		}
		await outputItemOrList(this, config, this.args.tag,
			() => this.client.deviceProfiles.listLocales(deviceProfileId),
			tag =>  this.client.deviceProfiles.getTranslations(deviceProfileId, tag))
	}
}
