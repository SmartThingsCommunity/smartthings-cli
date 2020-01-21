import { Configuration } from 'log4js'
import { Hook } from '@oclif/config'

import { cliConfig } from '@smartthings/cli-lib'
import { logManager } from '@smartthings/cli-lib'


const hook: Hook<'init'> = async function (opts) {
	cliConfig.init(`${opts.config.configDir}/config.yaml`)

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const config: { [name: string]: any } = cliConfig.loadConfig()
	let logConfig: Configuration
	if ('logging' in config) {
		logConfig = config['logging']
	} else {
		logConfig = {
			appenders: { smartthings: { type: 'file', filename: 'smartthings.log' }},
			categories: {
				default: { appenders: ['smartthings'], level: 'warn' },
				'rest-client': { appenders: ['smartthings'], level: 'warn' },
				'cli': { appenders: ['smartthings'], level: 'warn' },
			},
		}
	}

	logManager.init(logConfig)
}

export default hook
