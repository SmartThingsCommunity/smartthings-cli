import AppsAuthorizeCommand from '../../../commands/apps/authorize'
import { addPermission } from '../../../lib/aws-utils'


jest.mock('../../../lib/aws-utils')

describe('AppsAuthorizeCommand', () => {
	const mockAddPermission = jest.mocked(addPermission)
	const logSpy = jest.spyOn(AppsAuthorizeCommand.prototype, 'log').mockImplementation()
	const success = 'Authorization added'
	const arn = 'arn'

	beforeAll(() => {
		mockAddPermission.mockResolvedValue(success)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('requires ARN arg', async () => {
		await expect(AppsAuthorizeCommand.run([])).rejects.toThrow('Missing 1 required arg:\narn')
	})

	it('calls addPermission with required ARN', async () => {
		await expect(AppsAuthorizeCommand.run([arn])).resolves.not.toThrow()

		expect(mockAddPermission).toBeCalledWith(arn, undefined, undefined)
		expect(logSpy).toBeCalledWith(success)
	})

	it('calls addPermission with principal flag', async () => {
		const principal = 'principal'
		await expect(AppsAuthorizeCommand.run([arn, `--principal=${principal}`])).resolves.not.toThrow()

		expect(mockAddPermission).toBeCalledWith(arn, principal, undefined)
		expect(logSpy).toBeCalledWith(success)
	})

	it('calls addPermission with statement-id flag', async () => {
		const statementId = 'statementId'
		await expect(AppsAuthorizeCommand.run([arn, `--statement-id=${statementId}`])).resolves.not.toThrow()

		expect(mockAddPermission).toBeCalledWith(arn, undefined, statementId)
		expect(logSpy).toBeCalledWith(success)
	})

	it('throws unexpected errors', async () => {
		const error = new Error('unexpected')
		mockAddPermission.mockRejectedValueOnce(error)

		await expect(AppsAuthorizeCommand.run([arn])).rejects.toThrow(error)
	})
})
