import type {
	SmartAppListOptions,
	SmartAppResponse,
	PagedSmartApp,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import { fatalError } from '../../util.js'


/**
 * A `catch` handler for Smart App API calls that create or modify a Smart App. The API returns
 * a 403 for accounts that don't have a paid plan; in that case, exit with a message explaining
 * how to upgrade. All other errors are rethrown.
 */
export const paidPlanRequiredHandler = (error: unknown): never => {
	if ((error as { response?: { status?: number } } | undefined)?.response?.status === 403) {
		return fatalError('Creating or modifying a Smart App requires a paid plan. Visit' +
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
