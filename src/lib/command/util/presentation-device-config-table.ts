import {
	type PresentationDeviceConfig,
	type PresentationDeviceConfigEntry,
	type PresentationDPInfo,
} from '@smartthings/core-sdk'

import { type TableGenerator } from '../../table-generator.js'


export const buildTableOutput = (tableGenerator: TableGenerator, deviceConfig: PresentationDeviceConfig): string => {
	const basicInfo = tableGenerator.buildTableFromItem(
		deviceConfig,
		['presentationId', 'manufacturerName', { prop: 'type', skipEmpty: true }, { prop: 'iconUrl', skipEmpty: true }],
	)

	const buildDPInfoTable = (items: PresentationDPInfo[]): string =>
		tableGenerator.buildTableFromList(
			items,
			[
				{ label: 'OS', prop: 'os' },
				{ label: 'URI', prop: 'dpUri' },
				{ label: 'Operating Mode', value: item => item.operatingMode ? item.operatingMode : 'none' },
			],
		)
	const dpInfo = deviceConfig.dpInfo
		? `DP Info\n${buildDPInfoTable(deviceConfig.dpInfo)}`
		: 'No DP info'

	const buildConfigEntryTable = (items: PresentationDeviceConfigEntry[]): string =>
		tableGenerator.buildTableFromList(
			items,
			[
				'component',
				'capability',
				{ label: 'version', value: item => item.version?.toString() ?? 'unspecified' },
				{ label: 'Values', value: item => item.values?.length ? item.values.length.toString() : 'none' },
				{ label: 'Visible Condition', value: item => item.visibleCondition ? 'included' : 'none' },
			]).toString()

	const dashboardStates = deviceConfig.dashboard?.states && deviceConfig.dashboard.states.length > 0
		? `Dashboard States\n${buildConfigEntryTable(deviceConfig.dashboard.states)}`
		: 'No dashboard states'

	const dashboardActions = deviceConfig.dashboard?.actions?.length
		? `Dashboard Actions\n${buildConfigEntryTable(deviceConfig.dashboard.actions)}`
		: 'No dashboard actions'

	const detailView = deviceConfig.detailView?.length
		? `Detail View Items\n${buildConfigEntryTable(deviceConfig.detailView)}`
		: 'No detail view items'

	const automationConditions = deviceConfig.automation?.conditions?.length
		? `Automation Conditions\n${buildConfigEntryTable(deviceConfig.automation.conditions)}`
		: 'No automation conditions'

	const automationActions = deviceConfig.automation?.actions?.length
		? `Automation Actions\n${buildConfigEntryTable(deviceConfig.automation.actions)}`
		: 'No automation actions'

	return `Basic Information\n${basicInfo}\n\n` +
		`${dpInfo}\n\n` +
		`${dashboardStates}\n\n` +
		`${dashboardActions}\n\n` +
		`${detailView}\n\n` +
		`${automationConditions}\n\n` +
		automationActions
}
