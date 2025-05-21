import { type DeviceProfileTranslations } from '@smartthings/core-sdk'

import { defaultTableGenerator } from '../../../../lib/table-generator.js'


const { buildTableOutput } = await import('../../../../lib/command/util/deviceprofiles-translations-table.js')

describe('buildTableOutput', () => {
	const tableGenerator = defaultTableGenerator({ groupRows: false })

	it('describes components', () => {
		const translations: DeviceProfileTranslations = {
			tag: 'es',
			components: {
				main: { label: 'Main Label', description: 'Main Description' },
				sansDescription: { label: 'Sans Description' },
			},
		}

		expect(buildTableOutput(tableGenerator, translations)).toBe(
			'Tag: es\n\n' +
			'─────────────────────────────────────────────────────\n' +
			' Component        Label             Description      \n' +
			'─────────────────────────────────────────────────────\n' +
			' main             Main Label        Main Description \n' +
			' sansDescription  Sans Description                   \n' +
			'─────────────────────────────────────────────────────\n',
		)
	})

	it('mentions no components when there are none', () => {
		const translations: DeviceProfileTranslations = { tag: 'es' }

		expect(buildTableOutput(tableGenerator, translations)).toBe(
			'Tag: es\n\n' +
			'No components\n',
		)
	})
})
