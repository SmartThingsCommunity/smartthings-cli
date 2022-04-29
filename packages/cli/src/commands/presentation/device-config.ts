import { PresentationDeviceConfig, PresentationDPInfo, PresentationDeviceConfigEntry } from '@smartthings/core-sdk'

import { APICommand, outputItem, summarizedText, TableGenerator } from '@smartthings/cli-lib'


export function buildTableOutput(tableGenerator: TableGenerator, deviceConfig: PresentationDeviceConfig): string {
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
		summarizedText
}

export default class DeviceConfigPresentationCommand extends APICommand<typeof DeviceConfigPresentationCommand.flags> {
	static description = 'query device config by presentationId'

	static flags = {
		...APICommand.flags,
		...outputItem.flags,
	}

	static args = [{
		name: 'presentationId',
		description: 'system generated identifier that corresponds to a device presentation',
		required: true,
	},
	{
		name: 'manufacturerName',
		description: 'manufacturer name. Defaults to SmartThingsCommunity',
		required: false,
	}]

	async run(): Promise<void> {
		await outputItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) },
			() => this.client.presentation.get(this.args.presentationId, this.args.manufacturerName))
	}
}
