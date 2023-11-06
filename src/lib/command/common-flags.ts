import { Argv } from 'yargs'


export type LambdaAuthFlags = {
	principal?: string
	statement?: string
}

export const lambdaAuthBuilder = <T extends object>(yargs: Argv<T>): Argv<T & LambdaAuthFlags> =>
	yargs
		.option('principal', { desc: 'use this principal instead of the default when authorizing lambda functions', type: 'string' })
		.option('statement', { desc: 'use this statement id instead of the default when authorizing lambda functions', type: 'string' })

export type AllOrganizationFlags = {
	allOrganizations: boolean
}

export const allOrganizationsBuilder = <T extends object>(yargs: Argv<T>): Argv<T & AllOrganizationFlags> =>
	yargs
		.option('all-organizations', {
			desc: 'include entities from all organizations the user belongs to',
			alias: 'A',
			type: 'boolean',
			default: false,
		}) as unknown as Argv<T & AllOrganizationFlags>
