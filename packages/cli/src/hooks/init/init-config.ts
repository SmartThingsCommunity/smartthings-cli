import type { Hook } from '@oclif/core'
import log4js from 'log4js'

import { LoginAuthenticator } from '@smartthings/cli-lib'
import { buildDefaultLog4jsConfig, loadLog4jsConfig } from '../../lib/log-utils.js'


const hook: Hook<'init'> = async function (opts) {
	LoginAuthenticator.init(`${opts.config.configDir}/credentials.json`)

	const defaultLogConfig = buildDefaultLog4jsConfig(`${opts.config.cacheDir}/smartthings.log`)
	const logConfig = loadLog4jsConfig(`${opts.config.configDir}/logging.yaml`, defaultLogConfig)

	log4js.configure(logConfig)
}

export default hook
