import { PresentationDevicePresentation } from '@smartthings/core-sdk'

import { APICommand, outputItem, TableGenerator } from '@smartthings/cli-lib'


export function buildTableOutput(tableGenerator: TableGenerator, presentation: PresentationDevicePresentation): string {
	const basicInfo = tableGenerator.buildTableFromItem(presentation, [
		{ prop: 'presentationId', label: 'Presentation ID' }, { prop: 'manufacturerName', label: 'Manufacturer Name' }, 'iconUrl',
	])

	let dashboardStates = 'No dashboard states'
	if (presentation.dashboard?.states && presentation.dashboard.states.length > 0) {
		const subTable = tableGenerator.newOutputTable({ head: ['Label', 'Alternatives', 'Group'] })
		for (const state of presentation.dashboard.states) {
			const alternatives = state.alternatives?.length
				? state.alternatives.length
				: 'none'
			subTable.push([
				state.label,
				alternatives,
				state.group ? state.group : '',
			])
		}
		dashboardStates = `Dashboard States\n${subTable.toString()}`
	}

	function buildDisplayTypeTable(items: { displayType: string }[]): string {
		const subTable = tableGenerator.newOutputTable({ head: ['Display Type'] })
		for (const item of items) {
			subTable.push([item.displayType])
		}
		return subTable.toString()
	}

	function buildLabelDisplayTypeTable(items: { label: string; displayType: string }[]): string {
		const subTable = tableGenerator.newOutputTable({ head: ['Label', 'Display Type'] })
		for (const item of items) {
			subTable.push([item.label, item.displayType])
		}
		return subTable.toString()
	}

	let dashboardActions = 'No dashboard actions'
	if (presentation.dashboard?.actions?.length) {
		dashboardActions = `Dashboard Actions\n${buildDisplayTypeTable(presentation.dashboard.actions)}`
	}

	let dashboardBasicPlus = 'No dashboard basic plus items'
	if (presentation.dashboard?.basicPlus?.length) {
		dashboardBasicPlus = `Dashboard Basic Plus\n${buildDisplayTypeTable(presentation.dashboard.basicPlus)}`
	}

	let detailViews = 'No detail views'
	if (presentation.detailView?.length) {
		const subTable = tableGenerator.newOutputTable({ head: ['Capability', 'Version', 'Component'] })
		for (const detailView of presentation.detailView) {
			subTable.push([
				detailView.capability,
				detailView.version ? detailView.version : 'none',
				detailView.component,
			])
		}
		detailViews = `Detail Views\n${subTable.toString()}`
	}

	let automationConditions = 'No automation conditions'
	if (presentation.automation?.conditions?.length) {
		automationConditions = `Automation Conditions\n${buildLabelDisplayTypeTable(presentation.automation.conditions)}`
	}

	let automationActions = 'No automation actions'
	if (presentation.automation?.actions?.length) {
		automationActions = `Automation Actions\n${buildLabelDisplayTypeTable(presentation.automation.actions)}`
	}

	return `Basic Information\n${basicInfo}\n\n` +
		`${dashboardStates}\n\n` +
		`${dashboardActions}\n\n` +
		`${dashboardBasicPlus}\n\n` +
		`${detailViews}\n\n` +
		`${automationConditions}\n\n` +
		`${automationActions}\n\n` +
		'(Information is summarized, for full details use YAML or JSON flag.)'
}

export default class PresentationCommand extends APICommand {
	static description = 'query device presentation by vid'

	static flags = {
		...APICommand.flags,
		...outputItem.flags,
	}

	static args = [
		{
			name: 'presentationId',
			description: 'system generated identifier that corresponds to a device presentation',
			required: true,
		},
		{
			name: 'manufacturerName',
			description: 'manufacturer name. Defaults to SmartThingsCommunity',
			required: false,
		},
	]

	static examples = [
		'$ smartthings presentation fd4adb7f-4a23-4134-9b39-05ed889a03cf',
		'$ smartthings presentation 4ea31e30-2aba-41c7-a3ec-8f97423d565a SmartThings',
		'$ smartthings presentation fd4adb7f-4a23-4134-9b39-05ed889a03cf --language=ko',
		'$ smartthings presentation fd4adb7f-4a23-4134-9b39-05ed889a03cf --language=NONE',
		'',
		'Specifying only the presentationId defaults to the "SmartThingsCommunity" manufacturer',
		'name and the language set for the computer\'s operating system. The language can be',
		'overridden by specifying an ISO language code. If "NONE" is specified for the language',
		'flag then no language header is specified in the API request',
	]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(PresentationCommand)
		await super.setup(args, argv, flags)

		const config = {
			buildTableOutput: (data: PresentationDevicePresentation) => buildTableOutput(this.tableGenerator, data),
		}
		await outputItem(this, config,
			() => this.client.presentation.getPresentation(args.presentationId, args.manufacturerName))
	}
}
