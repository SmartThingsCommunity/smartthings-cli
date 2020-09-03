import { flags } from '@oclif/command'


export const lambdaAuthFlags = {
	principal: flags.string({
		description: 'use this principal instead of the default when authorizing lambda functions',
	}),
	'statement-id': flags.string({
		description: 'use this statement id instead of the default when authorizing lambda functions',
	}),
}
