import type { Hook } from '@oclif/core'

import { LoginAuthenticator, logManager, defaultLoggingConfig, loadLoggingConfig } from '@smartthings/cli-lib'


const hook: Hook<'init'> = async function (opts) {
	LoginAuthenticator.init(`${opts.config.configDir}/credentials.json`)

	const defaultLogConfig = defaultLoggingConfig(`${opts.config.cacheDir}/smartthings.log`)
	const logConfig = loadLoggingConfig(`${opts.config.configDir}/logging.yaml`, defaultLogConfig)

	logManager.init(logConfig)
}

export default hook
