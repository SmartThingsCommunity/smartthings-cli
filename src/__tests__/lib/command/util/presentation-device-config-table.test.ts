import type { PresentationDeviceConfig, PresentationDeviceConfigEntry, PresentationDPInfo } from '@smartthings/core-sdk'

import type { ValueTableFieldDefinition } from '../../../../lib/table-generator.js'
import { buildTableFromItemMock, buildTableFromListMock, tableGeneratorMock } from '../../../test-lib/table-mock.js'


const { buildTableOutput } = await import('../../../../lib/command/util/presentation-device-config-table.js')


describe('buildTableOutput', () => {
	buildTableFromItemMock.mockReturnValue('basic info')

	const baseDeviceConfig: PresentationDeviceConfig = {
		presentationId: 'presentation-id',
		manufacturerName: 'Manufacturer Name',
	}

	it('displays "No <thing>" when there is no <thing>', () => {
		expect(buildTableOutput(tableGeneratorMock, baseDeviceConfig)).toBe(
			'Basic Information\nbasic info\n\n' +
			'No DP info\n\n' +
			'No dashboard states\n\n' +
			'No dashboard actions\n\n' +
			'No detail view items\n\n' +
			'No automation conditions\n\n' +
			'No automation actions',
		)

		expect(buildTableFromItemMock).toHaveBeenCalledExactlyOnceWith(
			baseDeviceConfig,
			expect.arrayContaining(['presentationId', 'manufacturerName']),
		)
	})

	it('displays DP Info when included', () => {
		buildTableFromListMock.mockReturnValue('the dp info')

		const deviceConfig: PresentationDeviceConfig = {
			...baseDeviceConfig,
			dpInfo: [
				{ os: 'An OS', dpUri: 'dp-uri', operatingMode: 'easySetup' },
			],
		}

		expect(buildTableOutput(tableGeneratorMock, deviceConfig)).toBe(
			'Basic Information\nbasic info\n\n' +
			'DP Info\nthe dp info\n\n' +
			'No dashboard states\n\n' +
			'No dashboard actions\n\n' +
			'No detail view items\n\n' +
			'No automation conditions\n\n' +
			'No automation actions',
		)

		expect(buildTableFromListMock).toHaveBeenCalledExactlyOnceWith(
			deviceConfig.dpInfo,
			expect.arrayContaining([{ label: 'OS', prop: 'os' }]),
		)

		const operatingModeValue =
			(buildTableFromListMock.mock.calls[0][1][2] as ValueTableFieldDefinition<PresentationDPInfo>).value

		expect(operatingModeValue({ operatingMode: 'easySetup' } as PresentationDPInfo)).toBe('easySetup')
		expect(operatingModeValue({} as PresentationDPInfo)).toBe('none')
	})

	it('displays dashboard states when included', () => {
		buildTableFromListMock.mockReturnValue('the dashboard states')

		const deviceConfig: PresentationDeviceConfig = {
			...baseDeviceConfig,
			dashboard: {
				states: [{ capability: 'switch', component: 'main' }],
				actions: [],
			},
		}

		expect(buildTableOutput(tableGeneratorMock, deviceConfig)).toBe(
			'Basic Information\nbasic info\n\n' +
			'No DP info\n\n' +
			'Dashboard States\nthe dashboard states\n\n' +
			'No dashboard actions\n\n' +
			'No detail view items\n\n' +
			'No automation conditions\n\n' +
			'No automation actions',
		)

		expect(buildTableFromListMock).toHaveBeenCalledExactlyOnceWith(
			deviceConfig.dashboard?.states,
			expect.arrayContaining(['component', 'capability']),
		)

		const versionValue =
			(buildTableFromListMock.mock.calls[0][1][2] as ValueTableFieldDefinition<PresentationDeviceConfigEntry>).value

		expect(versionValue({ version: 17 } as PresentationDeviceConfigEntry)).toBe('17')
		expect(versionValue({} as PresentationDeviceConfigEntry)).toBe('unspecified')
	})

	it('displays dashboard actions when included', () => {
		buildTableFromListMock.mockReturnValue('the dashboard actions')

		const deviceConfig: PresentationDeviceConfig = {
			...baseDeviceConfig,
			dashboard: {
				states: [],
				actions: [{ capability: 'switch', component: 'main' }],
			},
		}

		expect(buildTableOutput(tableGeneratorMock, deviceConfig)).toBe(
			'Basic Information\nbasic info\n\n' +
			'No DP info\n\n' +
			'No dashboard states\n\n' +
			'Dashboard Actions\nthe dashboard actions\n\n' +
			'No detail view items\n\n' +
			'No automation conditions\n\n' +
			'No automation actions',
		)

		expect(buildTableFromListMock).toHaveBeenCalledExactlyOnceWith(
			deviceConfig.dashboard?.actions,
			expect.arrayContaining(['component', 'capability']),
		)

		const valuesValue =
			(buildTableFromListMock.mock.calls[0][1][3] as ValueTableFieldDefinition<PresentationDeviceConfigEntry>).value

		expect(valuesValue({ values: [{}, {}] } as PresentationDeviceConfigEntry)).toBe('2')
		expect(valuesValue({} as PresentationDeviceConfigEntry)).toBe('none')
		expect(valuesValue({ values: [] } as unknown as PresentationDeviceConfigEntry)).toBe('none')
	})

	it('displays detail view items when included', () => {
		buildTableFromListMock.mockReturnValue('the detail view items')

		const deviceConfig: PresentationDeviceConfig = {
			...baseDeviceConfig,
			detailView: [{ component: 'switch', capability: 'main' }],
		}

		expect(buildTableOutput(tableGeneratorMock, deviceConfig)).toBe(
			'Basic Information\nbasic info\n\n' +
			'No DP info\n\n' +
			'No dashboard states\n\n' +
			'No dashboard actions\n\n' +
			'Detail View Items\nthe detail view items\n\n' +
			'No automation conditions\n\n' +
			'No automation actions',
		)

		expect(buildTableFromListMock).toHaveBeenCalledExactlyOnceWith(
			deviceConfig.detailView,
			expect.arrayContaining(['component', 'capability']),
		)

		const visibleConditionValue =
			(buildTableFromListMock.mock.calls[0][1][4] as ValueTableFieldDefinition<PresentationDeviceConfigEntry>).value

		expect(visibleConditionValue({ visibleCondition: {} } as PresentationDeviceConfigEntry)).toBe('included')
		expect(visibleConditionValue({} as PresentationDeviceConfigEntry)).toBe('none')
	})

	it('displays automation conditions when included', () => {
		buildTableFromListMock.mockReturnValue('the automation conditions')

		const deviceConfig: PresentationDeviceConfig = {
			...baseDeviceConfig,
			automation: {
				conditions: [{ capability: 'switch', component: 'main' }],
				actions: [],
			},
		}

		expect(buildTableOutput(tableGeneratorMock, deviceConfig)).toBe(
			'Basic Information\nbasic info\n\n' +
			'No DP info\n\n' +
			'No dashboard states\n\n' +
			'No dashboard actions\n\n' +
			'No detail view items\n\n' +
			'Automation Conditions\nthe automation conditions\n\n' +
			'No automation actions',
		)

		expect(buildTableFromListMock).toHaveBeenCalledExactlyOnceWith(
			deviceConfig.automation?.conditions,
			expect.arrayContaining(['component', 'capability']),
		)
	})

	it('displays automation actions when included', () => {
		buildTableFromListMock.mockReturnValue('the automation actions')

		const deviceConfig: PresentationDeviceConfig = {
			...baseDeviceConfig,
			automation: {
				conditions: [],
				actions: [{ capability: 'switch', component: 'main' }],
			},
		}

		expect(buildTableOutput(tableGeneratorMock, deviceConfig)).toBe(
			'Basic Information\nbasic info\n\n' +
			'No DP info\n\n' +
			'No dashboard states\n\n' +
			'No dashboard actions\n\n' +
			'No detail view items\n\n' +
			'No automation conditions\n\n' +
			'Automation Actions\nthe automation actions',
		)

		expect(buildTableFromListMock).toHaveBeenCalledExactlyOnceWith(
			deviceConfig.automation?.actions,
			expect.arrayContaining(['component', 'capability']),
		)
	})
})
