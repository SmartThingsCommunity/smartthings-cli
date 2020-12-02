import { PresentationDevicePresentation } from '@smartthings/core-sdk'

import {OutputAPICommand, TableGenerator} from '@smartthings/cli-lib'


export function buildTableOutput(presentation: PresentationDevicePresentation, tableGenerator: TableGenerator): string {
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
		'(Information is summarized, for full details use YAML or JSON flags.)'
}

export default class PresentationCommand extends OutputAPICommand<PresentationDevicePresentation> {
	static description = 'query device presentation by vid'

	static flags = OutputAPICommand.flags

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

	protected buildTableOutput(presentation: PresentationDevicePresentation): string {
		return buildTableOutput(presentation, this.tableGenerator)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(PresentationCommand)
		await super.setup(args, argv, flags)

		await this.processNormally(() => {
			return this.client.presentation.getPresentation(args.presentationId, args.manufacturerName)
		})
	}
}
