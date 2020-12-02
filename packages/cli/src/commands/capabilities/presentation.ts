import { flags } from '@oclif/command'

import { CapabilityPresentation } from '@smartthings/core-sdk'

import { APICommand, ListingOutputAPICommandBase } from '@smartthings/cli-lib'

import { capabilityIdOrIndexInputArgs, getCustomByNamespace, translateToId,
	CapabilityId, CapabilitySummaryWithNamespace } from '../capabilities'


export function buildTableOutput(this: APICommand, presentation: CapabilityPresentation): string {
	const tableGenerator = this.tableGenerator

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
		`${automationActions}\n\n` +
		'(Information is summarized, for full details use YAML or JSON flags.)'
}

export default class PresentationsCommand extends ListingOutputAPICommandBase<CapabilityId, CapabilityPresentation, CapabilitySummaryWithNamespace> {
	static description = 'get presentation information for a specific capability'

	static flags = {
		...ListingOutputAPICommandBase.flags,
		namespace: flags.string({
			char: 'n',
			description: 'a specific namespace to query; will use all by default',
		}),
	}

	static args = capabilityIdOrIndexInputArgs

	primaryKeyName = 'id'
	sortKeyName = 'id'

	protected listTableFieldDefinitions = ['id', 'version', 'status']

	protected buildTableOutput = buildTableOutput
	protected translateToId = translateToId

	private getCustomByNamespace = getCustomByNamespace

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(PresentationsCommand)
		await super.setup(args, argv, flags)

		const idOrIndex = args.version
			? { id: args.id, version: args.version }
			: args.id
		await this.processNormally(
			idOrIndex,
			() => this.getCustomByNamespace(flags.namespace),
			(id) =>  this.client.capabilities.getPresentation(id.id, id.version))
	}
}
