import { Hook } from '@oclif/config'

import { LoginAuthenticator, cliConfig, loadLoggingConfig, logManager } from '@smartthings/cli-lib'


const hook: Hook<'init'> = async function (opts) {
	cliConfig.init(`${opts.config.configDir}/config.yaml`)
	LoginAuthenticator.init(`${opts.config.configDir}/credentials.json`)
	logManager.init(loadLoggingConfig(`${opts.config.configDir}/logging.yaml`))
}

export default hook
