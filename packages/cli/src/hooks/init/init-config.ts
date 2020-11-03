import { Hook } from '@oclif/config'

import { LoginAuthenticator, cliConfig, logManager, defaultLoggingConfig, loadLoggingConfig } from '@smartthings/cli-lib'


const hook: Hook<'init'> = async function (opts) {
	cliConfig.init(`${opts.config.configDir}/config.yaml`)
	LoginAuthenticator.init(`${opts.config.configDir}/credentials.json`)

	const defaultLogConfig = defaultLoggingConfig(`${opts.config.cacheDir}/smartthings.log`)
	const logConfig = loadLoggingConfig(`${opts.config.configDir}/logging.yaml`, defaultLogConfig)

	logManager.init(logConfig)
}

export default hook
