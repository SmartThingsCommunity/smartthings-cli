import { flags } from '@oclif/command'


export const lambdaAuthFlags = {
	principal: flags.string({
		description: 'use this principal instead of the default when authorizing lambda functions',
	}),
	'statement-id': flags.string({
		description: 'use this statement id instead of the default when authorizing lambda functions',
	}),
}

export const allOrganizationsFlags = {
	'all-organizations': flags.boolean({
		char: 'A',
		description: 'include entities from all organizations the user belongs to',
	}),
}
