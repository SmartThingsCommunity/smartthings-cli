import { type SchemaAppRequest } from '@smartthings/core-sdk'

import { awsHelpText } from '../../aws-util.js'
import {
	optionalDef,
	optionalStringDef,
	stringDef,
	undefinedDef,
	type InputDefinition,
} from '../../item-input/index.js'


export const arnDef = (
		name: string,
		inChina: boolean,
		initialValue?: SchemaAppRequest,
		options?: { forChina?: boolean },
): InputDefinition<string | undefined> => {
	if (inChina && !options?.forChina || !inChina && options?.forChina) {
		return undefinedDef
	}

	const helpText = awsHelpText
	const initiallyActive = initialValue?.hostingType === 'lambda'

	// In China there is only one ARN field so we can make it required. Globally there are three
	// and at least one of the three is required, but individually all are optional.
	// (See `validateFinal` function below for the validation requiring at least one.)
	return optionalDef(
		inChina ? stringDef(name, { helpText }) : optionalStringDef(name, { helpText }),
		(context?: unknown[]) =>
			(context?.[0] as Pick<SchemaAppRequest, 'hostingType'>)?.hostingType === 'lambda',
		{ initiallyActive },
	)
}

export const webHookUrlDef = (
		inChina: boolean,
		initialValue?: SchemaAppRequest,
): InputDefinition<string | undefined> => {
	if (inChina) {
		return undefinedDef
	}

	const initiallyActive = initialValue?.hostingType === 'webhook'
	return optionalDef(
		stringDef('Webhook URL'),
		(context?: unknown[]) =>
			(context?.[0] as Pick<SchemaAppRequest, 'hostingType'>)?.hostingType === 'webhook',
		{ initiallyActive },
	)
}
