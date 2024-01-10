import { APICommand } from './api-command'
import { EventSourceError, handleSignals } from './sse-util'
import EventSource from 'eventsource'
import { Errors } from '@oclif/core'
import { HttpClientHeaders } from '@smartthings/core-sdk'


export abstract class SseCommand<T extends typeof SseCommand.flags> extends APICommand<T> {
	static flags = APICommand.flags

	private _source?: EventSource

	get source(): EventSource {
		if (this._source) {
			return this._source
		}

		throw new Error('SseCommand not initialized properly')
	}

	async initSource(url: string, sourceInitDict?: EventSource.EventSourceInitDict): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const headers: HttpClientHeaders = { 'User-Agent': this.userAgent }

		// assume auth is taken care of if passing an initDict
		if (!sourceInitDict) {
			const authHeaders = await this.authenticator.authenticate()
			sourceInitDict = { headers: { ...headers, ...authHeaders } }
		} else {
			sourceInitDict = { ...sourceInitDict, headers: { ...headers, ...sourceInitDict?.headers } }
		}

		this._source = new EventSource(url, sourceInitDict)

		this._source.onerror = (error: EventSourceError) => {
			this.teardown()

			try {
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

				this.error(message)
			} catch (error) {
				Errors.handle(error)
			}
		}
	}

	teardown(): void {
		try {
			this._source?.close()
		} catch (error) {
			this.logger.warn(`Error during SseCommand teardown. ${error.message ?? error}`)
		}
	}

	setupSignalHandler(): void {
		handleSignals(signal => {
			this.logger.debug(`handling ${signal} and tearing down SseCommand`)

			this.teardown()
		})
	}

	async catch(error: unknown): Promise<void> {
		this.teardown()

		if (error instanceof Error) {
			await super.catch(error)
		}

		throw error
	}
}
