import { CapabilityLocalization } from '@smartthings/core-sdk'

import { APIOrganizationCommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../translations'
import { capabilityIdInputArgs, chooseCapability } from '../../../lib/commands/capabilities-util'


export default class CapabilityTranslationsCreateCommand extends APIOrganizationCommand<typeof CapabilityTranslationsCreateCommand.flags> {
	static description = 'create a capability translation'

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = capabilityIdInputArgs

	static examples = [
		'$ smartthings capabilities:translations:create custom1.outputModulation 1 -i en.yaml ',
		'tag: en\n' +
		'label: Output Modulation\n' +
		'attributes:\n' +
		'  outputModulation:\n' +
		'    label: Output Modulation\n' +
		'    displayTemplate: \'The {{attribute}} of {{device.label}} is {{value}}\'\n' +
		'    i18n:\n' +
		'      value:\n' +
		'        50hz:\n' +
		'          label: 50 Hz\n' +
		'        60hz:\n' +
		'          label: 60 Hz\n' +
		'commands:\n' +
		'  setOutputModulation:\n' +
		'    label: Set Output Modulation\n' +
		'    arguments:\n' +
		'      outputModulation:\n' +
		'        label: Output Modulation',
		'$ smartthings capabilities:translations:create -i en.yaml',
		'┌───┬─────────────────────────────┬─────────┬──────────┐\n' +
		'│ # │ Id                          │ Version │ Status   │\n' +
		'├───┼─────────────────────────────┼─────────┼──────────┤\n' +
		'│ 1 │ custom1.outputModulation    │ 1       │ proposed │\n' +
		'│ 2 │ custom1.outputVoltage       │ 1       │ proposed │\n' +
		'└───┴─────────────────────────────┴─────────┴──────────┘',
		'? Enter id or index 1',
		'tag: en\n' +
		'label: Output Modulation\n' +
		'attributes:\n' +
		'  outputModulation:\n' +
		'    label: Output Modulation\n' +
		'    displayTemplate: \'The {{attribute}} of {{device.label}} is {{value}}\'\n' +
		'    i18n:\n' +
		'      value:\n' +
		'        50hz:\n' +
		'          label: 50 Hz\n' +
		'        60hz:\n' +
		'          label: 60 Hz\n' +
		'commands:\n' +
		'  setOutputModulation:\n' +
		'    label: Set Output Modulation\n' +
		'    arguments:\n' +
		'      outputModulation:\n' +
		'        label: Output Modulation',
	]

	async run(): Promise<void> {
		const id = await chooseCapability(this, this.args.id, this.args.version)
		await inputAndOutputItem<CapabilityLocalization, CapabilityLocalization>(this,
			{ buildTableOutput: data => buildTableOutput(this.tableGenerator, data) },
			(_, translations) => this.client.capabilities.createTranslations(id.id, id.version, translations))
	}
}
