import { Argv } from 'yargs'


export type CapabilityIdInputFlags = {
	id?: string
	capabilityVersion?: number
}

export const capabilityIdBuilder = <T extends object>(
	yargs: Argv<T>,
): Argv<T & CapabilityIdInputFlags> =>
	yargs
		.positional('id', { desc: 'the capability id', type: 'string' })
		.positional(
			'capability-version',
			{ desc: 'the capability version', type: 'number', demandOption: 'id' },
		)

export type CapabilityIdOrIndexInputFlags = Omit<CapabilityIdInputFlags, 'id'> & {
	idOrIndex?: string
}

export const capabilityIdOrIndexBuilder = <T extends object>(
	yargs: Argv<T>,
): Argv<T & CapabilityIdOrIndexInputFlags> =>
	yargs
		.positional('idOrIndex', { desc: 'the capability id or number in list', type: 'string' })
		.positional(
			'capability-version',
			{ desc: 'the capability version', type: 'number', demandOption: 'idOrIndex' },
		)
