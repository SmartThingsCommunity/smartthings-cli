import { type DeviceProfileTranslations } from '@smartthings/core-sdk'

import { type TableGenerator } from '../../table-generator.js'


export const buildTableOutput = (tableGenerator: TableGenerator, data: DeviceProfileTranslations): string => {
	const componentInfo = data.components
		? tableGenerator.buildTableFromList(
			Object.entries(data.components).map(
				([component, translations]) => ({ component, label: translations.label, description: translations.description }),
			),
			['component', 'label', 'description'],
		)
		: 'No components\n'

	return `Tag: ${data.tag}\n\n${componentInfo}`
}
