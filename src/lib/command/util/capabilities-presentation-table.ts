import { CapabilityPresentation } from '@smartthings/core-sdk'

import { type TableGenerator } from '../../table-generator.js'


export const buildTableOutput = (
		tableGenerator: TableGenerator,
		presentation: CapabilityPresentation,
): string => {
	const basicInfo = tableGenerator.buildTableFromItem(presentation, ['id', 'version'])

	let dashboardStates = 'No dashboard states'
	if (presentation.dashboard?.states?.length) {
		const newDashboardStates = tableGenerator.buildTableFromList(
			presentation.dashboard.states,
			[
				'label',
				{ label: 'Alternatives', value: (state) => (state.alternatives?.length?.toString() ?? 'none') },
				'group',
			],
		)
		dashboardStates = `Dashboard States\n${newDashboardStates}`
	}

	const buildDisplayTypeTable = (items: { displayType: string }[]): string =>
		tableGenerator.buildTableFromList(items, ['displayType'])

	const buildLabelDisplayTypeTable = (items: { label: string; displayType: string }[]): string => {
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

	let detailView = 'No detail view items'
	if (presentation.detailView?.length) {
		const subTable = tableGenerator.buildTableFromList(presentation.detailView, ['label', 'displayType'])
		detailView = `Detail View Items\n${subTable}`
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
		`${detailView}\n\n` +
		`${automationConditions}\n\n` +
		automationActions
}
