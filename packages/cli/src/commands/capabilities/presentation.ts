import { Flags } from '@oclif/core'

import { CapabilityPresentation } from '@smartthings/core-sdk'

import { APIOrganizationCommand, OutputItemOrListConfig, outputItemOrListGeneric, TableGenerator } from '@smartthings/cli-lib'

import { CapabilityId, capabilityIdOrIndexInputArgs, CapabilitySummaryWithNamespace, getCustomByNamespace, translateToId } from '../../lib/commands/capabilities-util'


export function buildTableOutput(tableGenerator: TableGenerator, presentation: CapabilityPresentation): string {
	const basicInfo = tableGenerator.buildTableFromItem(presentation, ['id', 'version'])

	let dashboardStates = 'No dashboard states'
	if (presentation.dashboard?.states && presentation.dashboard.states.length > 0) {
		const newDashboardStates = tableGenerator.buildTableFromList(presentation.dashboard.states, ['label',
			{ label: 'Alternatives', value: (state) => (state.alternatives?.length?.toString() ?? 'none') },
			'group',
		])
		dashboardStates = `Dashboard States\n${newDashboardStates}`
	}

	function buildDisplayTypeTable(items: { displayType: string }[]): string {
		return tableGenerator.buildTableFromList(items, ['displayType'])
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

	let detailView = 'No Detail View Items'
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

export default class PresentationsCommand extends APIOrganizationCommand<typeof PresentationsCommand.flags> {
	static description = 'get presentation information for a specific capability'

	static flags = {
		...APIOrganizationCommand.flags,
		...outputItemOrListGeneric.flags,
		namespace: Flags.string({
			char: 'n',
			description: 'a specific namespace to query; will use all by default',
		}),
	}

	static args = capabilityIdOrIndexInputArgs

	async run(): Promise<void> {
		const idOrIndex = this.args.version
			? { id: this.args.id, version: this.args.version }
			: this.args.id
		const sortKeyName = 'id'
		const config: OutputItemOrListConfig<CapabilityPresentation, CapabilitySummaryWithNamespace> = {
			primaryKeyName: 'id',
			sortKeyName,
			listTableFieldDefinitions: ['id', 'version', 'status'],
			buildTableOutput: (data: CapabilityPresentation) => buildTableOutput(this.tableGenerator, data),
		}
		await outputItemOrListGeneric(this, config, idOrIndex,
			() => getCustomByNamespace(this.client, this.flags.namespace),
			(id: CapabilityId) =>  this.client.capabilities.getPresentation(id.id, id.version),
			(idOrIndex, listFunction) => translateToId(sortKeyName, idOrIndex, listFunction))
	}
}
