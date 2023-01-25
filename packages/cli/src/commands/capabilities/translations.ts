import { Flags } from '@oclif/core'

import { CapabilityLocalization, DeviceProfileTranslations, LocaleReference } from '@smartthings/core-sdk'

import { APIOrganizationCommand, OutputItemOrListConfig, outputItemOrList, selectFromList,
	SelectFromListConfig, TableGenerator, WithLocales } from '@smartthings/cli-lib'

import { CapabilityId, capabilityIdOrIndexInputArgs, CapabilitySummaryWithNamespace, getCustomByNamespace,
	getIdFromUser, translateToId } from '../../lib/commands/capabilities-util'


export function buildTableOutput(tableGenerator: TableGenerator, data: CapabilityLocalization): string {
	let result = `Tag: ${data.tag}`
	if (data.attributes) {
		const table = tableGenerator.newOutputTable({ head: ['Name', 'Label', 'Description', 'Template'] })
		for (const name of Object.keys(data.attributes)) {
			const attr = data.attributes[name]
			table.push([name, attr.label, attr.description || '', attr.displayTemplate || ''])
			if (attr.i18n?.value) {
				for (const key of Object.keys(attr.i18n.value)) {
					const entry = attr.i18n.value[key]
					table.push([`${name}.${key}`, `${entry ? entry['label'] : ''}`, `${entry ? entry['description'] || '' : ''}`, ''])
				}
			}
		}
		result += '\n\nAttributes:\n' + table.toString()
	}
	if (data.commands) {
		const table = tableGenerator.newOutputTable({ head: ['Name', 'Label', 'Description'] })
		for (const name of Object.keys(data.commands)) {
			const cmd = data.commands[name]
			table.push([name, cmd.label || '', cmd.description || ''])
			if (cmd.arguments) {
				for (const key of Object.keys(cmd.arguments)) {
					const entry = cmd.arguments[key]
					table.push([`${name}.${key}`, `${entry ? entry['label'] : ''}`, `${entry ? entry['description'] || '' : ''}`])
				}
			}
		}
		result += '\n\nCommands:\n' + table.toString()
	}
	return result
}

export type CapabilitySummaryWithLocales = CapabilitySummaryWithNamespace & WithLocales

export default class CapabilityTranslationsCommand extends APIOrganizationCommand<typeof CapabilityTranslationsCommand.flags> {
	static description = 'get list of locales supported by the capability' +
		this.apiDocsURL('listCapabilityLocalizations', 'getCapabilityLocalization')

	static flags = {
		...APIOrganizationCommand.flags,
		...outputItemOrList.flags,
		namespace: Flags.string({
			char: 'n',
			description: 'a specific namespace to query; will use all by default',
		}),
		verbose: Flags.boolean({
			description: 'include list of supported locales in table output',
			char: 'v',
		}),
	}

	static args = [
		...capabilityIdOrIndexInputArgs,
		{ name: 'tag', description: 'the locale tag' },
	]

	static examples = [
		'$ smartthings capabilities:translations\n' +
		'┌───┬─────────────────────────────┬─────────┬──────────┐\n' +
		'│ # │ Id                          │ Version │ Status   │\n' +
		'├───┼─────────────────────────────┼─────────┼──────────┤\n' +
		'│ 1 │ custom1.outputModulation    │ 1       │ proposed │\n' +
		'│ 2 │ custom1.outputVoltage       │ 1       │ proposed │\n' +
		'└───┴─────────────────────────────┴─────────┴──────────┘',
		'? Select a capability. 1\n' +
		'┌───┬─────┐\n' +
		'│ # │ Tag │\n' +
		'├───┼─────┤\n' +
		'│ 1 │ en  │\n' +
		'│ 2 │ ko  │\n' +
		'└───┴─────┘',
		'$ st capabilities:translations -v\n' +
		'┌───┬─────────────────────────────┬─────────┬──────────┬────────────┐\n' +
		'│ # │ Id                          │ Version │ Status   │ Locales    │\n' +
		'├───┼─────────────────────────────┼─────────┼──────────┼────────────┤\n' +
		'│ 1 │ custom1.outputModulation    │ 1       │ proposed │ ko, en, es │\n' +
		'│ 2 │ custom1.outputVoltage       │ 1       │ proposed │ en         │\n' +
		'└───┴─────────────────────────────┴─────────┴──────────┴────────────┘',
		'? Select a capability. 1\n' +
		'┌───┬─────┐\n' +
		'│ # │ Tag │\n' +
		'├───┼─────┤\n' +
		'│ 1 │ en  │\n' +
		'│ 1 │ es  │\n' +
		'│ 2 │ ko  │\n' +
		'└───┴─────┘',
		'$ smartthings capabilities:translations 1\n' +
		'$ smartthings capabilities:translations custom1.outputModulation\n' +
		'┌───┬─────┐\n' +
		'│ # │ Tag │\n' +
		'├───┼─────┤\n' +
		'│ 1 │ en  │\n' +
		'│ 2 │ ko  │\n' +
		'└───┴─────┘',
		'$ smartthings capabilities:translations 1 1\n' +
		'$ smartthings capabilities:translations 1 en\n' +
		'$ smartthings capabilities:translations custom1.outputModulation 1 1\n' +
		'$ smartthings capabilities:translations custom1.outputModulation 1 en\n' +
		'$ smartthings capabilities:translations custom1.outputModulation en',
		'Tag: en',
		'Attributes:\n' +
		'┌────────────────────────┬───────────────────┬────────────────────────────────┬────────────────────────────────────────────────────┐\n' +
		'│ Name                   │ Label             │ Description                    │ Template                                           │\n' +
		'├────────────────────────┼───────────────────┼────────────────────────────────┼────────────────────────────────────────────────────┤\n' +
		'│ outputModulation       │ Output Modulation │ Power supply output modulation │ The {{attribute}} of {{device.label}} is {{value}} │\n' +
		'│ outputModulation.50hz  │ 50 Hz             │                                │                                                    │\n' +
		'│ outputModulation.60hz  │ 60 Hz             │                                │                                                    │\n' +
		'└────────────────────────┴───────────────────┴────────────────────────────────┴────────────────────────────────────────────────────┘',
		'Commands\n' +
		'┌──────────────────────────────────────┬───────────────────────┬──────────────────────────────────────────────────┐\n' +
		'│ Name                                 │ Label                 │ Description                                      │\n' +
		'├──────────────────────────────────────┼───────────────────────┼──────────────────────────────────────────────────┤\n' +
		'│ setOutputModulation                  │ Set Output Modulation │ Set the output modulation to the specified value │\n' +
		'│ setOutputModulation.outputModulation │ Output Modulation     │ The desired output modulation                    │\n' +
		'└──────────────────────────────────────┴───────────────────────┴──────────────────────────────────────────────────┘',
	]

	async run(): Promise<void> {
		const primaryKeyName = 'id'
		const capConfig: SelectFromListConfig<CapabilitySummaryWithLocales> = {
			primaryKeyName: 'id',
			listTableFieldDefinitions: ['id', 'version', 'status'],
		}
		if (this.flags.verbose) {
			capConfig.listTableFieldDefinitions.splice(3, 0, 'locales')
		}
		const listItems = async (): Promise<CapabilitySummaryWithLocales[]> => {
			const capabilities = await getCustomByNamespace(this.client, this.flags.namespace)
			if (this.flags.verbose) {
				const ops = capabilities.map(it => this.client.capabilities.listLocales(it.id, it.version))
				const locales = await Promise.all(ops)
				return capabilities.map((it, index) => {
					return { ...it, locales: locales[index].map(it => it.tag).sort().join(', ') }
				})
			}
			return capabilities
		}

		let preselectedId: CapabilityId | undefined = undefined
		let preselectedTag: string | undefined = undefined
		if (this.args.tag) {
			// capabilityId, capabilityVersion, tag
			preselectedId = { id: this.args.id, version: this.args.version }
			preselectedTag = this.args.tag
		} else if (this.args.version) {
			if (isNaN(this.args.id) && !isNaN(this.args.version)) {
				// capabilityId, capabilityVersion, no tag specified
				preselectedId = { id: this.args.id, version: this.args.version }
			} else {
				// capability id or index, no capability version specified, tag specified
				preselectedId = await translateToId(primaryKeyName, this.args.id, listItems)
				preselectedTag = this.args.version
			}
		} else {
			// capability id or index, no tag specified
			preselectedId = await translateToId(primaryKeyName, this.args.id, listItems)
		}

		const capabilityId = await selectFromList<CapabilitySummaryWithLocales, CapabilityId>(this, capConfig, {
			preselectedId,
			listItems,
			getIdFromUser,
			promptMessage: 'Select a capability.',
		})

		const config: OutputItemOrListConfig<DeviceProfileTranslations, LocaleReference> = {
			primaryKeyName: 'tag',
			sortKeyName: 'tag',
			listTableFieldDefinitions: ['tag'],
			buildTableOutput: data => buildTableOutput(this.tableGenerator, data),
		}

		await outputItemOrList(this, config, preselectedTag,
			() => this.client.capabilities.listLocales(capabilityId.id, capabilityId.version),
			tag => this.client.capabilities.getTranslations(capabilityId.id, capabilityId.version, tag),
			true)
	}
}
