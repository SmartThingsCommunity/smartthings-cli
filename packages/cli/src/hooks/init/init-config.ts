import { Configuration } from 'log4js'
import { Hook } from '@oclif/config'

import { cliConfig, logManager, LoginAuthenticator } from '@smartthings/cli-lib'


const hook: Hook<'init'> = async function (opts) {
	cliConfig.init(`${opts.config.configDir}/config.yaml`)
	LoginAuthenticator.init(`${opts.config.configDir}/credentials.json`)

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const config: { [name: string]: any } = cliConfig.loadConfig()
	let logConfig: Configuration
	if ('logging' in config) {
		logConfig = config['logging']
	} else {
		logConfig = {
			appenders: {
				smartthings: { type: 'file', filename: 'smartthings.log' },
				stderr: { type: 'stderr' },
				errors: { type: 'logLevelFilter', appender: 'stderr', level: 'error' },
			},
			categories: {
				default: { appenders: ['smartthings', 'errors'], level: 'warn' },
				'rest-client': { appenders: ['smartthings', 'errors'], level: 'warn' },
				cli: { appenders: ['smartthings', 'errors'], level: 'warn' },
			},
		}
	}

	logManager.init(logConfig)
}

export default hook
