import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { createHash, randomBytes, BinaryLike } from 'crypto'
import express from 'express'
import fs from 'fs'
import getPort from 'get-port'
import open from 'open'
import qs from 'qs'

import { Authenticator } from '@smartthings/smartthings-core-js/dist/base/authenticator'

import { logManager } from './logger'


const urls: { [type: string]: { [env: string]: string }} = {
	baseAuth: {
		prod: 'https://oauthin-regional.api.smartthings.com/oauth',
		dev: 'https://oauthin-regionald.smartthingsgdev.com/oauth',
		staging: 'https://oauthin-regionals.smartthingsgdev.com/oauth',
	},
	tokenRefresh: {
		prod: 'https://auth-global.api.smartthings.com/oauth/token',
		dev: 'https://auth-globald.smartthingsgdev.com/oauth/token',
		staging: 'https://auth-globals.smartthingsgdev.com/oauth/token',
	},
}

const clientIds: { [env: string]: string } = {
	prod: 'none yet',
	dev: 'none yet',
	staging: '4f5b6c3b-640a-4d2b-861a-bfa45e25895f',
}

// All the scopes the clientId we are using is configured to use.
const scopes = [
	'r:devices:*',
	'w:devices:*',
	'r:locations:*',
	'w:locations:*',
]
const postConfig = {
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
	}
}


interface AuthenticationInfo {
	targetEnvironment: string
	accessToken: string
	refreshToken: string
	expires: Date
	// scope is a space-separated list of scopes
	// In the future, we could consider making the type `string | string[]`
	scope: string
	installedAppId: string
	deviceId: string
}


export class LoginAuthenticator implements Authenticator {
	private static credentialsFile?: string
	public static init(credentialsFile: string): void {
		LoginAuthenticator.credentialsFile = credentialsFile
	}
	private clientId: string

	private authenticationInfo?: AuthenticationInfo
	private logger = logManager.getLogger('login-authenticator')

	constructor(private profileName: string, private targetEnvironment: string) {
		this.logger.trace('constructing a LoginAuthenticator')
		if (!(targetEnvironment in clientIds)) {
			throw new Error(`invalid target environment: ${targetEnvironment}`)
		}
		this.clientId = clientIds[targetEnvironment]
		if (!LoginAuthenticator.credentialsFile) {
			throw new Error('LoginAuthenticator credentials file not set.')
		}
		// we could consider doing this lazily at some point
		const credentialsFileData = this.readCredentialsFile()
		if (profileName in credentialsFileData) {
			const authInfo = credentialsFileData[profileName]
			this.authenticationInfo = {
				...authInfo,
				expires: new Date(authInfo.expires)
			}
			this.logger.trace(`authentication info from file = ${JSON.stringify(this.authenticationInfo, null, 4)}`)
		}
	}

	private base64URLEncode(data: Buffer): string {
		return data.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
	}

	private sha256(data: BinaryLike): Buffer {
		return createHash('sha256').update(data).digest()

	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private readCredentialsFile(): { [profileName: string]: any } {
		if (!LoginAuthenticator.credentialsFile) {
			throw new Error('credentials file location not set')
		}
		if (fs.existsSync(LoginAuthenticator.credentialsFile)) {
			const fileData = fs.readFileSync(LoginAuthenticator.credentialsFile)
			return JSON.parse(fileData.toString())
		}
		return {}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private updateTokenFromResponse(response: AxiosResponse<any>): void {
		if (!LoginAuthenticator.credentialsFile) {
			throw new Error('credentials file location not set')
		}
		this.authenticationInfo = {
			targetEnvironment: this.targetEnvironment,
			accessToken: response.data.access_token,
			refreshToken: response.data.refresh_token,
			expires: new Date(Date.now() + response.data.expires_in * 1000),
			scope: response.data.scope,
			installedAppId: response.data.installed_app_id,
			deviceId: response.data.device_id
		}
		const credentialsFileData = this.readCredentialsFile()
		credentialsFileData[this.profileName] = this.authenticationInfo
		fs.writeFileSync(LoginAuthenticator.credentialsFile, JSON.stringify(credentialsFileData, null, 4))
		// TODO: test on Windows
		fs.chmod(LoginAuthenticator.credentialsFile, 0o600, err => {
			if (err) {
				this.logger.error('failed to set permissions on credentials file')
				throw err
			}
		})
	}

	async login(): Promise<void> {
		const verifier = this.base64URLEncode(randomBytes(32))

		const app = express()

		const port = await getPort({ port: [61973, 61974, 61975] })

		const baseAuthURL = urls.baseAuth[this.targetEnvironment]
		const codeChallenge = this.base64URLEncode(this.sha256(verifier))
		const finishURL = `http://localhost:${port}/finish`
		app.get('/start', (req, res) => {
			const redirectTo = `${baseAuthURL}/authorize?scope=${scopes.join('+')}&` +
				`response_type=code&client_id=${this.clientId}&` +
				`code_challenge=${codeChallenge}&code_challenge_method=S256&` +
				`redirect_uri=${encodeURIComponent(finishURL)}&` +
				'client_type=USER_LEVEL'
			this.logger.trace(`redirecting to: ${redirectTo}`)
			res.redirect(redirectTo)
		})

		app.get('/finish', (req, res) => {
			if ('error' in req.query) {
				this.logger.error(`received "${req.query.error}" error when trying to authenticate`)
				if ('error_description' in req.query) {
					this.logger.error(`  ${req.query.error_description}`)
				}
			}
			const requestBody = {
				'grant_type': 'authorization_code',
				'client_id': this.clientId,
				'code_verifier': verifier,
				'code': req.query.code,
				'redirect_uri': finishURL
			}
			this.logger.trace(`making axios request to ${baseAuthURL}/token with:`)
			this.logger.trace(`  body: ${qs.stringify(requestBody)}`)
			this.logger.trace(`  config: ${JSON.stringify(postConfig)}`)
			this.logger.trace(`code = ${req.query.code}`)
			if (0) {
				// I used this for debugging. Axios does not include the body of the response in any way I could find.
				this.logger.trace(`\n\nRun:\ncurl -i --request POST --url '${baseAuthURL}/token' --header 'content-type: application/x-www-form-urlencoded' ` +
					`--data grant_type=authorization_code --data 'client_id=${this.clientId}' --data code_verifier=${verifier} --data code=${req.query.code} ` +
					`--data 'redirect_uri=${finishURL}' --header 'X-ST-CORRELATION: ross-pkce-attempt'\n\n`)
			} else {
				axios.post(`${baseAuthURL}/token`, qs.stringify(requestBody), postConfig)
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.then((response: AxiosResponse<any>) => {
						this.updateTokenFromResponse(response)
					})
					.catch(err => {
						this.logger.trace(`got error ${err.name}/${err}}/${err.message} trying to get final token`)
						this.logger.trace(`err = ${JSON.stringify(err, null, 4)}`)
					})
			}
			res.send('<html><body><h1>You can close the window.</h1></body></html>')
		})

		const server = app.listen(port, () => {
			this.logger.trace(`listening on port ${port}`)
			open(`http://localhost:${port}/start`)
		})

		const startTime = Date.now()
		const maxDelay = 10 * 60 * 1000 // wait up to ten minutes for login
		return new Promise(async (resolve, reject) => {
			while (!this.authenticationInfo && Date.now() < startTime + maxDelay) {
				await this.delay(1000)
			}
			server.close((err) => {
				if (err) {
					this.logger.error(`error closing express server: ${err}`)
				}
				if (this.authenticationInfo) {
					this.logger.trace(`got authentication info: ${JSON.stringify(this.authenticationInfo)}`)
					resolve()
				} else {
					this.logger.trace('unable to get authentication info')
					reject()
				}
			})
		})
	}

	private async refreshToken(): Promise<void> {
		this.logger.trace('refreshing token')
		const tokenRefreshURL = urls.tokenRefresh[this.targetEnvironment]
		const requestBody = {
			'grant_type': 'refresh_token',
			'client_id': this.clientId,
			'refresh_token': this.authenticationInfo?.refreshToken,
		}
		const postConfig = {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			}
		}
		this.logger.trace(`making axios request to ${tokenRefreshURL} with:`)
		this.logger.trace(`  body: ${qs.stringify(requestBody)}`)
		this.logger.trace(`  config: ${JSON.stringify(postConfig)}`)
		await axios.post(tokenRefreshURL, qs.stringify(requestBody), postConfig)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.then((response: AxiosResponse<any>) => {
				this.updateTokenFromResponse(response)
			})
			.catch(err => {
				this.logger.trace(`got error ${err.name}/${err}}/${err.message} trying to get refresh token`)
				this.logger.trace(`err = ${JSON.stringify(err, null, 4)}`)
			})
	}

	async authenticate(requestConfig: AxiosRequestConfig): Promise<AxiosRequestConfig> {
		this.logger.trace('authentication - enter')
		// refresh if we have less than an hour left on the auth token
		if (this.authenticationInfo && this.authenticationInfo.expires.getTime() < Date.now() + 60 * 60 * 1000) {
			await this.refreshToken()
		}
		// log in if we don't have authentication info or the refresh failed
		if (!this.authenticationInfo || this.authenticationInfo.expires.getTime() < Date.now() + 59 * 60 * 1000) {
			await this.login()
		}
		if (this.authenticationInfo) {
			return {
				...requestConfig,
				headers: {
					...requestConfig.headers,
					Authorization: `Bearer ${this.authenticationInfo.accessToken}`,
				},
			}
		}
		throw new Error('unable to obtain user credentials')
	}
}
