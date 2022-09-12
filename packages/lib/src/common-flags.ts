import { Flags } from '@oclif/core'


export const lambdaAuthFlags = {
	principal: Flags.string({
		description: 'use this principal instead of the default when authorizing lambda functions',
	}),
	statement: Flags.string({
		description: 'use this statement id instead of the default when authorizing lambda functions',
	}),
}

export const allOrganizationsFlags = {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	'all-organizations': Flags.boolean({
		char: 'A',
		description: 'include entities from all organizations the user belongs to',
	}),
}
