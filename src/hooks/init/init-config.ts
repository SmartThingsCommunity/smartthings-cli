import { Hook } from '@oclif/config'
import cliConfig from '../../lib/cli-config'


const hook: Hook<'init'> = async function (opts) {
	cliConfig.init(`${opts.config.configDir}/config.yaml`)
}

export default hook
