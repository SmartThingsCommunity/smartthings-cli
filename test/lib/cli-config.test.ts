// import { expect, test } from '@oclif/test'
import { expect } from 'chai'

import { CLIConfig } from '../../src/lib/cli-config'

describe('cliConfig', () => {
	it('throws error when uninitialized', function() {
		const cliConfig = new CLIConfig()
		expect(cliConfig.loadConfig.bind(cliConfig)).to.throw('config not yet initialized')
	})

	it('adds config.yaml to directory for config filename', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init('/my/config/dir/config.yaml')
		expect(cliConfig.configFile).to.equal('/my/config/dir/config.yaml')
	})

	it('returns an empty config with no config file', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init('/path/to/no/file/at/all/config.yaml')
		expect(cliConfig.loadConfig()).to.eql({})
	})

	it('returns an empty config for empty config file', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init('./test/resources/empty-config.yaml')
		expect(cliConfig.loadConfig()).to.eql({})
	})

	it('throws error for bad config file', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init('./test/resources/bad-config.yaml')
		expect(cliConfig.loadConfig.bind(cliConfig)).to.throw()
	})

	it('throws error for config file with just a string', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init('./test/resources/string-config.yaml')
		expect(cliConfig.loadConfig.bind(cliConfig)).to.throw('invalid config file format')
	})

	it('getProfile returns profile sub-tree', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init('./test/resources/good-config.yaml')
		expect(cliConfig.getProfile('simple')).to.eql({key: 'value'})
	})

	it('returns empty config for missing profile', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init('./test/resources/good-config.yaml')
		expect(cliConfig.getProfile('does-not-exist')).to.eql({})
	})

	it('throws error for bad profile', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init('./test/resources/good-config.yaml')
		expect(cliConfig.getProfile.bind(cliConfig, 'bad-profile')).to.throw('bad profile configuration')
	})
})
