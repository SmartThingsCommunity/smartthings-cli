import type {
	SmartAppListOptions,
	SmartAppResponse,
	PagedSmartApp,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import { fatalError } from '../../util.js'


/**
 * Build a function suitable for use as a `catch` handler on Smart App API calls. The API returns
 * a 403 for accounts that don't have a paid plan; in that case, exit with a message explaining
 * how to upgrade. All other errors are rethrown.
 *
 * @param action Description of what was being attempted, used to start the message,
 *   e.g. "Creating a Smart App".
 */
export const paidAccountRequiredHandler = (action: string) =>
	(error: unknown): never => {
		if ((error as { response?: { status?: number } } | undefined)?.response?.status === 403) {
			return fatalError(`${action} requires a paid account. Visit` +
				'\n  https://developer.smartthings.com/console/service-integrations/manage-plans' +
				'\nto upgrade.')
		}
		throw error
	}

export const verboseSmartApps = async (
		client: SmartThingsClient,
		listOptions: SmartAppListOptions,
): Promise<SmartAppResponse[]> => {
	const apps = await client.smartapps.list(listOptions)
	return Promise.all(apps.map(app => client.smartapps.get(app.appId)))
}

export const shortARNorURL = (app: PagedSmartApp & Partial<SmartAppResponse>): string => {
	const uri = (app.webhookSmartApp
		? app.webhookSmartApp.targetUrl
		: (app.lambdaSmartApp
			? (app.lambdaSmartApp.functions?.length ? app.lambdaSmartApp.functions[0] : '')
			: (app.apiOnly?.subscription?.targetUrl))) ?? ''

	return uri.length < 96 ? uri : uri.slice(0, 95) + '...'
}
