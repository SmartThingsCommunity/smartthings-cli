import { flags } from '@oclif/command'

import { DeviceProfile, DeviceProfileTranslations, LocaleReference } from '@smartthings/core-sdk'

import { APIOrganizationCommand, ListingOutputConfig, outputListing, TableGenerator } from '@smartthings/cli-lib'
import { chooseDeviceProfile } from '../deviceprofiles'


export function buildTableOutput(tableGenerator: TableGenerator, data: DeviceProfileTranslations): string {
	let result = `Tag: ${data.tag}`
	if (data.components) {
		const table = tableGenerator.newOutputTable({ head: ['Component','Label','Description'] })
		for (const name of Object.keys(data.components)) {
			const component = data.components[name]
			table.push([name, component.label, component.description || ''])
		}
		result += '\n' + table.toString()
	}
	return result
}

export type DeviceProfileWithLocales = DeviceProfile & { locales?: string }

export default class DeviceProfileTranslationsCommand extends APIOrganizationCommand {
	static description = 'Get list of locales supported by the device profiles'

	static flags = {
		...APIOrganizationCommand.flags,
		...outputListing.flags,
		verbose: flags.boolean({
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

	static aliases = ['device-profiles:translations']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfileTranslationsCommand)
		await super.setup(args, argv, flags)

		const deviceProfileId = await chooseDeviceProfile(this, args.id, { verbose: flags.verbose, allowIndex: true })

		const config: ListingOutputConfig<DeviceProfileTranslations, LocaleReference> = {
			primaryKeyName: 'tag',
			sortKeyName: 'tag',
			buildTableOutput: data => buildTableOutput(this.tableGenerator, data),
			listTableFieldDefinitions: ['tag'],
		}
		await outputListing(this, config, args.tag,
			() => this.client.deviceProfiles.listLocales(deviceProfileId),
			tag =>  this.client.deviceProfiles.getTranslations(deviceProfileId, tag))
	}
}
