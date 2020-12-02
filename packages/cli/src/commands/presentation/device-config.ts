import { PresentationDeviceConfig, PresentationDPInfo, PresentationDeviceConfigEntry } from '@smartthings/core-sdk'

import { APICommand, OutputAPICommand } from '@smartthings/cli-lib'


export function buildTableOutput(this: APICommand, deviceConfig: PresentationDeviceConfig): string {
	const tableGenerator = this.tableGenerator
	// This could use more advanced methods of tableGenerator.
	const table = tableGenerator.newOutputTable()
	table.push(['Presentation ID', deviceConfig.presentationId])
	table.push(['Manufacturer Name', deviceConfig.manufacturerName])
	if (deviceConfig.type) {
		table.push(['Type', deviceConfig.type])
	}
	if (deviceConfig.iconUrl) {
		table.push(['Icon URL', deviceConfig.iconUrl])
	}

	let dpInfo = 'No DP info'
	function buildDPInfoTable(items: PresentationDPInfo[]): string {
		const subTable = tableGenerator.newOutputTable({ head: ['OS', 'URI', 'Operating Mode'] })
		for (const item of items) {
			subTable.push([item.os, item.dpUri, item.operatingMode ? item.operatingMode : 'none'])
		}
		return subTable.toString()
	}
	if (deviceConfig.dpInfo) {
		dpInfo = `DP Info\n${buildDPInfoTable(deviceConfig.dpInfo)}`
	}

	function buildConfigEntryTable(items: PresentationDeviceConfigEntry[]): string {
		const subTable = tableGenerator.newOutputTable({ head: ['Component', 'Capability',
			'Version', 'Values', 'Visible Condition'] })
		for (const item of items) {
			const values = item.values?.length ? item.values.length : 'none'
			const visibleCondition = item.visibleCondition ? 'included' : 'none'
			subTable.push([item.component, item.capability,
				item.version ? item.version : 'unspecified', values,
				visibleCondition])
		}
		return subTable.toString()
	}

	let dashboardStates = 'No dashboard states'
	if (deviceConfig.dashboard?.states && deviceConfig.dashboard.states.length > 0) {
		dashboardStates = `Dashboard States\n${buildConfigEntryTable(deviceConfig.dashboard.states)}`
	}

	let dashboardActions = 'No dashboard actions'
	if (deviceConfig.dashboard?.actions?.length) {
		dashboardActions = `Dashboard Actions\n${buildConfigEntryTable(deviceConfig.dashboard.actions)}`
	}

	let detailView = 'No Detail View Items'
	if (deviceConfig.detailView?.length) {
		detailView = `Detail View Items\n${buildConfigEntryTable(deviceConfig.detailView)}`
	}

	let automationConditions = 'No automation conditions'
	if (deviceConfig.automation?.conditions?.length) {
		automationConditions = `Automation Conditions\n${buildConfigEntryTable(deviceConfig.automation.conditions)}`
	}

	let automationActions = 'No automation actions'
	if (deviceConfig.automation?.actions?.length) {
		automationActions = `Automation Actions\n${buildConfigEntryTable(deviceConfig.automation.actions)}`
	}

	return `Basic Information\n${table.toString()}\n\n` +
		`${dpInfo}\n\n` +
		`${dashboardStates}\n\n` +
		`${dashboardActions}\n\n` +
		`${detailView}\n\n` +
		`${automationConditions}\n\n` +
		`${automationActions}\n\n` +
		'(Information is summarized, for full details use YAML or JSON flags.)'
}

export default class Devices extends OutputAPICommand<PresentationDeviceConfig> {
	static description = 'query device config by presentationId'

	static flags = OutputAPICommand.flags

	static args = [{
		name: 'presentationId',
		description: 'system generated identifier that corresponds to a device presentation',
		required: true,
	}]

	protected buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(Devices)
		await super.setup(args, argv, flags)

		await this.processNormally(() => {
			return this.client.presentation.get(args.presentationId)
		})
	}
}
