import { flags } from '@oclif/command'

import {DeviceProfile, DeviceProfileTranslations, LocaleReference} from '@smartthings/core-sdk'

import { APICommand, NestedListingOutputAPICommand } from '@smartthings/cli-lib'


export function buildTableOutput(this: APICommand, data: DeviceProfileTranslations): string {
	let result = `Tag: ${data.tag}`
	if (data.components) {
		const table = this.tableGenerator.newOutputTable({head: ['Component','Label','Description']})
		for (const name of Object.keys(data.components)) {
			const component = data.components[name]
			table.push([name, component.label, component.description || ''])
		}
		result += '\n' + table.toString()
	}
	return result
}

export type DeviceProfileWithLocales = DeviceProfile & { locales?: string }

export default class DeviceProfileTranslationsCommand extends NestedListingOutputAPICommand<DeviceProfileTranslations, DeviceProfileWithLocales, LocaleReference> {
	static description = 'Get list of locales supported by the device profiles'

	static flags = {
		...NestedListingOutputAPICommand.flags,
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
		'',
		'$ smartthings deviceprofiles:translations -v',
		'┌────┬─────────────────────┬─────────────┬──────────────────────────────────────┬─────────┐',
		'│ #  │ Name                │ Status      │ Id                                   │ Locales │',
		'├────┼─────────────────────┼─────────────┼──────────────────────────────────────┼─────────┤',
		'│  1 │ Test Switch         │ DEVELOPMENT │ 58e73d0c-b5a5-4814-b344-c10f4ff357bb │         │',
		'│  2 │ Two Channel Outlet  │ DEVELOPMENT │ 3acbf2fc-6be2-4be0-aeb5-44759cbd66c2 │ en, es  │',
		'└────┴─────────────────────┴─────────────┴──────────────────────────────────────┴─────────┘',
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

	primaryKeyName = 'id'
	nestedPrimaryKeyName = 'tag'
	sortKeyName = 'name'
	nestedSortKeyName = 'tag'

	protected listTableFieldDefinitions = ['name', 'status', 'id']
	protected nestedListTableFieldDefinitions = ['tag']

	protected buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfileTranslationsCommand)
		await super.setup(args, argv, flags)

		if (this.flags.verbose) {
			this.listTableFieldDefinitions.splice(3, 0, 'locales')
		}

		const profileIdOrIndex = args.id
		const tagOrIndex = args.tag

		this.processNormally(
			profileIdOrIndex,
			tagOrIndex,
			async () => {
				const deviceProfiles =  await this.client.deviceProfiles.list()
				if (flags.verbose) {
					const ops = deviceProfiles.map(async (it) => {
						try {
							return await this.client.deviceProfiles.listLocales(it.id)
						} catch(e) {
							return []
						}
					})

					const locales = await Promise.all(ops)

					return deviceProfiles.map((it, index) => {
						return {...it, locales: locales[index].map((it: LocaleReference) => it.tag).sort().join(', ')}
					})
				}
				return deviceProfiles
			},
			(id) => {
				return this.client.deviceProfiles.listLocales(id)
			},
			(id, id2) =>  {
				return this.client.deviceProfiles.getTranslations(id, id2)
			})
	}
}
