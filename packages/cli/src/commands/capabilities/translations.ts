import { flags } from '@oclif/command'

import { CapabilityLocalization, LocaleReference } from '@smartthings/core-sdk'

import { APICommand, ListCallback, NestedListingOutputAPICommandBase, stringTranslateToNestedId } from '@smartthings/cli-lib'

import { CapabilityId, capabilityIdOrIndexInputArgs, CapabilitySummaryWithNamespace, getCustomByNamespace, translateToId } from '../capabilities'


export function buildTableOutput(this: APICommand, data: CapabilityLocalization): string {
	let result = `Tag: ${data.tag}`
	if (data.attributes) {
		const table = this.tableGenerator.newOutputTable({head: ['Name','Label','Description', 'Template']})
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
		const table = this.tableGenerator.newOutputTable({head: ['Name','Label','Description']})
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

export type CapabilitySummaryWithLocales = CapabilitySummaryWithNamespace & { locales?: string }

export default class CapabilityTranslationsCommand extends NestedListingOutputAPICommandBase<CapabilityId, string, CapabilityLocalization, CapabilitySummaryWithLocales, LocaleReference> {

	static description = 'Get list of locales supported by the capability'

	static flags = {
		...NestedListingOutputAPICommandBase.flags,
		namespace: flags.string({
			char: 'n',
			description: 'a specific namespace to query; will use all by default',
		}),
		verbose: flags.boolean({
			description: 'include list of supported locales in table output',
			char: 'v',
		}),
	}

	static args = [...capabilityIdOrIndexInputArgs, {
		name: 'tag',
		description: 'the locale tag',
	}]

	static examples = [
		'$ smartthings capabilities:translations',
		'┌───┬─────────────────────────────┬─────────┬──────────┐',
		'│ # │ Id                          │ Version │ Status   │',
		'├───┼─────────────────────────────┼─────────┼──────────┤',
		'│ 1 │ custom1.outputModulation    │ 1       │ proposed │',
		'│ 2 │ custom1.outputVoltage       │ 1       │ proposed │',
		'└───┴─────────────────────────────┴─────────┴──────────┘',
		'outputModulation (master)$ st capabilities:translations -v',
		'┌───┬─────────────────────────────┬─────────┬──────────┬────────────┐',
		'│ # │ Id                          │ Version │ Status   │ Locales    │',
		'├───┼─────────────────────────────┼─────────┼──────────┼────────────┤',
		'│ 1 │ custom1.outputModulation    │ 1       │ proposed │ ko, en, es │',
		'│ 2 │ custom1.outputVoltage       │ 1       │ proposed │ en         │',
		'└───┴─────────────────────────────┴─────────┴──────────┴────────────┘',
		'',
		'outputModulation (master)$ st capabilities:translations 1',
		'outputModulation (master)$ st capabilities:translations custom1.outputModulation',
		'┌───┬─────┐',
		'│ # │ Tag │',
		'├───┼─────┤',
		'│ 1 │ en  │',
		'│ 2 │ ko  │',
		'└───┴─────┘',
		'',
		'$ smartthings capabilities:translations 1 1',
		'$ smartthings capabilities:translations 1 en',
		'$ smartthings capabilities:translations custom1.outputModulation 1 1',
		'$ smartthings capabilities:translations custom1.outputModulation 1 en',
		'$ smartthings capabilities:translations custom1.outputModulation en',
		'Tag: en',
		'',
		'Attributes:',
		'┌────────────────────────┬───────────────────┬────────────────────────────────┬────────────────────────────────────────────────────┐',
		'│ Name                   │ Label             │ Description                    │ Template                                           │',
		'├────────────────────────┼───────────────────┼────────────────────────────────┼────────────────────────────────────────────────────┤',
		'│ outputModulation       │ Output Modulation │ Power supply output modulation │ The {{attribute}} of {{device.label}} is {{value}} │',
		'│ outputModulation.50hz  │ 50 Hz             │                                │                                                    │',
		'│ outputModulation.60hz  │ 60 Hz             │                                │                                                    │',
		'└────────────────────────┴───────────────────┴────────────────────────────────┴────────────────────────────────────────────────────┘',
		'',
		'Commands:',
		'┌──────────────────────────────────────┬───────────────────────┬──────────────────────────────────────────────────┐',
		'│ Name                                 │ Label                 │ Description                                      │',
		'├──────────────────────────────────────┼───────────────────────┼──────────────────────────────────────────────────┤',
		'│ setOutputModulation                  │ Set Output Modulation │ Set the output modulation to the specified value │',
		'│ setOutputModulation.outputModulation │ Output Modulation     │ The desired output modulation                    │',
		'└──────────────────────────────────────┴───────────────────────┴──────────────────────────────────────────────────┘',
	]

	primaryKeyName = 'id'
	nestedPrimaryKeyName = 'tag'
	sortKeyName = 'id'
	nestedSortKeyName = 'tag'

	protected listTableFieldDefinitions = ['id', 'version', 'status']
	protected nestedListTableFieldDefinition = ['tag']

	protected buildTableOutput = buildTableOutput
	// TODO: clean this up once all of the commands that use the imported `translateToId` function have been converted to the functional API
	protected translateToId = (idOrIndex: string | CapabilityId, listFunction: ListCallback<CapabilitySummaryWithNamespace>): Promise<CapabilityId> => translateToId(this.sortKeyName, idOrIndex, listFunction)
	protected translateToNestedId = stringTranslateToNestedId

	private getCustomByNamespace = getCustomByNamespace

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilityTranslationsCommand)
		await super.setup(args, argv, flags)

		if (this.flags.verbose) {
			this.listTableFieldDefinitions.splice(3, 0, 'locales')
		}

		let capabilityIdOrIndex = args.id
		let tagOrIndex = undefined
		if (argv.length === 3) {
			capabilityIdOrIndex = { id: args.id, version: args.version }
			tagOrIndex = args.tag
		} else if (argv.length === 2) {
			if (isNaN(args.id) && !isNaN(args.version)) {
				capabilityIdOrIndex = { id: args.id, version: args.version }
			} else {
				tagOrIndex = args.version
			}
		}

		await this.processNormally(
			capabilityIdOrIndex,
			tagOrIndex,
			async () => {
				const capabilities =  await this.getCustomByNamespace(flags.namespace)
				if (flags.verbose) {
					const ops = capabilities.map(it => this.client.capabilities.listLocales(it.id, it.version))
					const locales = await Promise.all(ops)
					return capabilities.map((it, index) => {
						return {...it, locales: locales[index].map(it => it.tag).sort().join(', ')}
					})
				}
				return capabilities
			},
			(id) => {
				return this.client.capabilities.listLocales(id.id, id.version)
			},
			(id, id2) =>  {
				return this.client.capabilities.getTranslations(id.id, id.version, id2)
			})
	}
}
