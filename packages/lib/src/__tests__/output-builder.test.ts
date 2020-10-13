
describe('buildOutputFormatter', () => {
	it('uses json when specified', () => {
		// buildOutputFormatter(command, )
	})

	it.todo('uses yaml when specified')

	it.todo('gets format from filename with input file')

	it.todo('defaults to inputFormat when not specified any other way')

	it.todo('falls back on JSON when unspecified and there is no common formatter')

	it.todo('defaults to indent of 2 for yaml')

	it.todo('defaults to indent of 4 for json')

	it.todo('accepts indent from config file over default')

	it.todo('accepts indent from command line over config file and default')
})
