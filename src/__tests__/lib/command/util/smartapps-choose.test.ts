import { jest } from '@jest/globals'

import { type SmartAppsEndpoint, type PagedSmartApp, type SmartAppListOptions } from '@smartthings/core-sdk'

import type { APICommand } from '../../../../lib/command/api-command.js'
import type { createChooseFn, ChooseFunction } from '../../../../lib/command/util/util-util.js'


const createChooseFnMock = jest.fn<typeof createChooseFn<PagedSmartApp>>()
jest.unstable_mockModule('../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))


const { chooseSmartAppFn } = await import('../../../../lib/command/util/smartapps-choose.js')


describe('chooseSmartAppFn', () => {
	const chooseAppMock = jest.fn<ChooseFunction<PagedSmartApp>>()
	const appList = [{ appId: 'listed-app-id' } as PagedSmartApp]
	const apiAppsListMock = jest.fn<typeof SmartAppsEndpoint.prototype.list>()
		.mockResolvedValue(appList)
	const command = {
		client: {
			smartapps: {
				list: apiAppsListMock,
			},
		},
	} as unknown as APICommand

	it('uses correct endpoint to list apps', async () => {
		createChooseFnMock.mockReturnValueOnce(chooseAppMock)

		const chooseApp = chooseSmartAppFn()

		expect(chooseApp).toBe(chooseAppMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ itemName: 'Smart App' }),
			expect.any(Function),
		)

		const listItems = createChooseFnMock.mock.calls[0][1]

		expect(await listItems(command)).toBe(appList)

		expect(apiAppsListMock).toHaveBeenCalledExactlyOnceWith(undefined)
	})

	it('passes smartAppListOptions on to smartapps.list function', async () => {
		createChooseFnMock.mockReturnValueOnce(chooseAppMock)

		const smartAppListOptions: SmartAppListOptions = { accountId: 'account-id' }

		const chooseApp = chooseSmartAppFn(smartAppListOptions)

		expect(chooseApp).toBe(chooseAppMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ itemName: 'Smart App' }),
			expect.any(Function),
		)

		const listItems = createChooseFnMock.mock.calls[0][1]

		expect(await listItems(command)).toBe(appList)

		expect(apiAppsListMock).toHaveBeenCalledExactlyOnceWith(smartAppListOptions)
	})
})
