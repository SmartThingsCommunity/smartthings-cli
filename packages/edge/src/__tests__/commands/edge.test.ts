import EdgeCommand from '../../commands/edge'


describe('EdgeCommand', () => {
	it('logs info on getting help when invoked without arguments', async () => {
		const logSpy = jest.spyOn(EdgeCommand.prototype, 'log')

		await expect(EdgeCommand.run([])).resolves.not.toThrow()

		expect(logSpy).toHaveBeenCalledTimes(1)
		expect(logSpy).toHaveBeenCalledWith('Run "smartthings edge --help" for info on the edge topic.')
	})
})
