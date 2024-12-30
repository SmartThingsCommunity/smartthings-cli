import type { CapabilityDetailView, CapabilityPresentation } from '@smartthings/core-sdk'

import {
	buildTableFromItemMock,
	buildTableFromListMock,
	newOutputTableMock,
	tableGeneratorMock,
	tablePushMock,
	tableToStringMock,
} from '../../../test-lib/table-mock.js'
import { ValueTableFieldDefinition } from '../../../../lib/table-generator.js'


const {
	buildTableOutput,
} = await import('../../../../lib/command/util/capabilities-presentation-table.js')


describe('buildTableOutput', () => {
	const bareMinimumPresentation: CapabilityPresentation = {
		id: 'presentation-id',
		version: 3,
	}
	const emptyPresentations: CapabilityPresentation[] = [
		bareMinimumPresentation,
		{ ...bareMinimumPresentation, dashboard: {} },
		{ ...bareMinimumPresentation, dashboard: { states: [] } },
		{ ...bareMinimumPresentation, dashboard: { actions: [] } },
		{ ...bareMinimumPresentation, dashboard: { basicPlus: [] } },
		{ ...bareMinimumPresentation, detailView: [] },
		{ ...bareMinimumPresentation, automation: {} },
		{ ...bareMinimumPresentation, automation: { conditions: [] } },
		{ ...bareMinimumPresentation, automation: { actions: [] } },
	]

	it.each(emptyPresentations)('handles empty fields', presentation => {
		buildTableFromItemMock.mockReturnValueOnce('basic info')

		expect(buildTableOutput(tableGeneratorMock, presentation)).toBe(
			`Basic Information
basic info

No dashboard states

No dashboard actions

No dashboard basic plus items

No detail view items

No automation conditions

No automation actions`,
		)

		expect(buildTableFromItemMock)
			.toHaveBeenCalledExactlyOnceWith(presentation, ['id', 'version'])
	})

	it('displays dashboard states', () => {
		const state = { label: 'state label' }
		const presentation = { ...bareMinimumPresentation, dashboard: { states: [state] } }
		buildTableFromListMock.mockReturnValueOnce('dashboard states')

		expect(buildTableOutput(tableGeneratorMock, presentation))
			.toContain('Dashboard States\ndashboard states')

		expect(buildTableFromListMock)
			.toHaveBeenCalledExactlyOnceWith([state], expect.arrayContaining(['label']))

		const alternativesValue = (buildTableFromListMock.mock.calls[0][1][1] as
			ValueTableFieldDefinition<object>).value

		expect(alternativesValue(state)).toBe('none')
		expect(alternativesValue({ alternatives: [] })).toBe('0')
		expect(alternativesValue({ alternatives: [{}, {}] })).toBe('2')
	})

	it('displays dashboard actions', () => {
		const action = { displayType: 'display type' }
		const presentation = { ...bareMinimumPresentation, dashboard: { actions: [action] } }
		buildTableFromListMock.mockReturnValueOnce('dashboard actions')

		expect(buildTableOutput(tableGeneratorMock, presentation))
			.toContain('Dashboard Actions\ndashboard actions')

		expect(buildTableFromListMock)
			.toHaveBeenCalledExactlyOnceWith([action], ['displayType'])
	})

	it('displays dashboard basic plus', () => {
		const basicPlus = { displayType: 'display type' }
		const presentation = { ...bareMinimumPresentation, dashboard: { basicPlus: [basicPlus] } }
		buildTableFromListMock.mockReturnValueOnce('dashboard basic plus')

		expect(buildTableOutput(tableGeneratorMock, presentation))
			.toContain('Dashboard Basic Plus\ndashboard basic plus')

		expect(buildTableFromListMock)
			.toHaveBeenCalledExactlyOnceWith([basicPlus], ['displayType'])
	})

	it('displays detail view information', () => {
		const detailView = [{ label: 'detail view label' } as CapabilityDetailView]
		const presentation = { ...bareMinimumPresentation, detailView }
		buildTableFromListMock.mockReturnValueOnce('detail view info')

		expect(buildTableOutput(tableGeneratorMock, presentation))
			.toContain('Detail View Items\ndetail view info')

		expect(buildTableFromListMock)
			.toHaveBeenCalledExactlyOnceWith(detailView, ['label', 'displayType'])
	})

	it('displays automation conditions', () => {
		const conditions = [{ label: 'condition label', displayType: 'display type' }]
		const presentation = { ...bareMinimumPresentation, automation: { conditions } }
		tableToStringMock.mockReturnValueOnce('automation conditions')

		expect(buildTableOutput(tableGeneratorMock, presentation))
			.toContain('Automation Conditions\nautomation conditions')

		expect(newOutputTableMock)
			.toHaveBeenCalledExactlyOnceWith({ head: ['Label', 'Display Type'] })
		expect(tablePushMock).toHaveBeenCalledExactlyOnceWith(['condition label', 'display type'])
		expect(tableToStringMock).toHaveBeenCalledExactlyOnceWith()
	})

	it('displays automation actions', () => {
		const actions = [{ label: 'action label', displayType: 'display type' }]
		const presentation = { ...bareMinimumPresentation, automation: { actions } }
		tableToStringMock.mockReturnValueOnce('automation actions')

		expect(buildTableOutput(tableGeneratorMock, presentation))
			.toContain('Automation Actions\nautomation actions')

		expect(newOutputTableMock)
			.toHaveBeenCalledExactlyOnceWith({ head: ['Label', 'Display Type'] })
		expect(tablePushMock).toHaveBeenCalledExactlyOnceWith(['action label', 'display type'])
		expect(tableToStringMock).toHaveBeenCalledExactlyOnceWith()
	})
})
