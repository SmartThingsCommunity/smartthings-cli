import { expect, test } from '@oclif/test'

import cliConfig from '../../src/lib/cli-config'

describe('hooks', () => {
	test
		.hook('init', { id: 'mycommand' })
		.it('shows a message', function() {
			expect(cliConfig.configFile).to.contain('/config.yaml')
		})
})
