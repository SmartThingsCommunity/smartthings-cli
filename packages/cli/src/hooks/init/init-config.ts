import type { Hook } from '@oclif/core'
import log4js from 'log4js'

import { LoginAuthenticator } from '@smartthings/cli-lib'
import { defaultLoggingConfig, loadLoggingConfig } from '../../lib/logger'


const hook: Hook<'init'> = async function (opts) {
	LoginAuthenticator.init(`${opts.config.configDir}/credentials.json`)

	const defaultLogConfig = defaultLoggingConfig(`${opts.config.cacheDir}/smartthings.log`)
	const logConfig = loadLoggingConfig(`${opts.config.configDir}/logging.yaml`, defaultLogConfig)

	// example of a cli-lib consumer just needing to configure log4js to enable cli logging
	// no global logManager required
	log4js.configure(logConfig)
}

export default hook
