import {CapabilityLocalization} from '@smartthings/core-sdk'
import {SelectingInputOutputAPICommandBase} from '@smartthings/cli-lib'

import {
	capabilityIdInputArgs, getCustomByNamespace, getIdFromUser,
	CapabilityId, CapabilitySummaryWithNamespace,
} from '../../capabilities'

import {buildTableOutput} from '../translations'


export default class CapabilityTranslationsUpsertCommand extends SelectingInputOutputAPICommandBase<CapabilityId, CapabilityLocalization, CapabilityLocalization, CapabilitySummaryWithNamespace> {
	static description = 'Create or update a capability translation'

	static flags = SelectingInputOutputAPICommandBase.flags

	static args = capabilityIdInputArgs

	static examples = [
		'$ smartthings capabilities:translations:upsert custom1.outputModulation 1 -i en.yml ',
		'tag: en',
		'label: Output Modulation',
		'attributes:',
		'  outputModulation:',
		'    label: Output Modulation',
		'    displayTemplate: \'The {{attribute}} of {{device.label}} is {{value}}\'',
		'    i18n:',
		'      value:',
		'        50hz:',
		'          label: 50 Hz',
		'        60hz:',
		'          label: 60 Hz',
		'commands:',
		'  setOutputModulation:',
		'    label: Set Output Modulation',
		'    arguments:',
		'      outputModulation:',
		'        label: Output Modulation',
		'',
		'$ smartthings capabilities:translations:upsert -i en.yml',
		'┌───┬─────────────────────────────┬─────────┬──────────┐',
		'│ # │ Id                          │ Version │ Status   │',
		'├───┼─────────────────────────────┼─────────┼──────────┤',
		'│ 1 │ custom1.outputModulation    │ 1       │ proposed │',
		'│ 2 │ custom1.outputVoltage       │ 1       │ proposed │',
		'└───┴─────────────────────────────┴─────────┴──────────┘',
		'? Enter id or index 1',
		'tag: en',
		'label: Output Modulation',
		'attributes:',
		'  outputModulation:',
		'    label: Output Modulation',
		'    displayTemplate: \'The {{attribute}} of {{device.label}} is {{value}}\'',
		'    i18n:',
		'      value:',
		'        50hz:',
		'          label: 50 Hz',
		'        60hz:',
		'          label: 60 Hz',
		'commands:',
		'  setOutputModulation:',
		'    label: Set Output Modulation',
		'    arguments:',
		'      outputModulation:',
		'        label: Output Modulation',
	]

	primaryKeyName = 'id'
	sortKeyName = 'id'

	protected listTableFieldDefinitions = ['id', 'version']

	protected buildTableOutput = buildTableOutput
	private getCustomByNamespace = getCustomByNamespace
	protected getIdFromUser = getIdFromUser

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilityTranslationsUpsertCommand)
		await super.setup(args, argv, flags)

		const idOrIndex = args.version
			? { id: args.id, version: args.version }
			: args.id

		await this.processNormally(idOrIndex,
			async () => this.getCustomByNamespace(),
			async (id, translations) => {
				return this.client.capabilities.upsertTranslations(id.id, id.version, translations)
			})
	}
}
