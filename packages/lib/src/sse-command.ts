import { APICommand } from './api-command'
import { handleSignals } from './sse-util'
import EventSource from 'eventsource'
import { handle } from '@oclif/errors'


export abstract class SseCommand extends APICommand {
	static flags = APICommand.flags

	private _source?: EventSource

	get source(): EventSource {
		if (this._source) {
			return this._source
		}

		throw new Error('SseCommand not initialized properly')
	}

	async initSource(url: string, sourceInitDict?: EventSource.EventSourceInitDict): Promise<void> {
		// assume auth is taken care of if passing an initDict
		if (!sourceInitDict && this.authenticator.authenticateGeneric) {
			const token = await this.authenticator.authenticateGeneric()
			sourceInitDict = { headers: { 'Authorization': `Bearer ${token}` } }
		}

		this._source = new EventSource(url, sourceInitDict)

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this._source.onerror = (error: any) => {
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

				this.teardown()
				this.error(message)
			} catch (error) {
				handle(error)
			}
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async setup(args: { [name: string]: any }, argv: string[], flags: { [name: string]: any }): Promise<void> {
		await super.setup(args, argv, flags)
	}

	teardown(): void {
		try {
			this._source?.close()
		} catch (error) {
			this.logger.warn(`Error during SseCommand cleanup. ${error.message ?? error}`)
		}
	}

	async init(): Promise<void> {
		await super.init()

		handleSignals(() => {
			this.teardown()
		})
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async catch(error: any): Promise<void> {
		this.teardown()

		throw error
	}
}
