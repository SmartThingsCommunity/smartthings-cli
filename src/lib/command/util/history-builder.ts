import { type Argv } from 'yargs'


export type HistoryFlags = {
	after?: string
	before?: string
	limit: number
	utc: boolean
}

export const historyBuilder = <T extends object>(yargs: Argv<T>): Argv<T & HistoryFlags> => yargs
	.option('after', {
		alias: 'A',
		describe: 'include events newer than or equal to this timestamp, expressed as an epoch' +
			' time in milliseconds or an ISO time string',
		type: 'string',
	})
	.option('before', {
		alias: 'B',
		describe: 'include events older than than this timestamp, expressed as an epoch time in' +
			' milliseconds or an ISO time string',
		type: 'string',
	})
	.option('limit', { alias: 'L', describe: 'maximum number of events to return', type: 'number', default: 20 })
	.option('utc', {
		alias: 'U',
		describe: 'display times in UTC time zone. Defaults to local time',
		type: 'boolean',
		default: false,
	})
