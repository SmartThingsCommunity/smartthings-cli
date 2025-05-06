import EventSource from 'eventsource'

import { HttpClientHeaders } from '@smartthings/core-sdk'

import { EventSourceError } from '../sse-util.js'
import { type APICommand, userAgent } from './api-command.js'


export const initSource = async (
		command: APICommand,
		url: string,
		sourceInitDict?: EventSource.EventSourceInitDict,
): Promise<{ source: EventSource; teardown: () => void }> => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const headers: HttpClientHeaders = { 'User-Agent': userAgent }

	// assume auth is taken care of if passing an initDict
	if (!sourceInitDict) {
		const authHeaders = await command.authenticator.authenticate()
		sourceInitDict = { headers: { ...headers, ...authHeaders } }
	} else {
		sourceInitDict = { ...sourceInitDict, headers: { ...headers, ...sourceInitDict?.headers } }
	}

	const source = new EventSource(url, sourceInitDict)
	const teardown = (): void => {
		try {
			source.close()
		} catch (error) {
			command.logger.warn(`Error during SseCommand teardown. ${error.message ?? error}`)
		}
	}

	source.onerror = (error: EventSourceError) => {
		teardown()

		let message
		if (error) {
			if (error.status) {
				if (error.status === 401 || error.status === 403) {
					message = `Event source not authorized. ${error.message}`
				} else {
					message = `Event source error ${error.status}. ${error.message}`
				}
			} else {
				message = `Event source error. ${error.message}`
			}
		} else {
			message = 'Unexpected event source error.'
		}

		console.error(message)
	}

	return { source, teardown }
}
