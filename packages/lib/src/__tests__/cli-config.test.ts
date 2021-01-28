import { CLIConfig } from '../cli-config'


const resourcesDir = './src/__tests__/resources'

describe('cliConfig', () => {
	it('loadConfig throws error when uninitialized', function() {
		const cliConfig = new CLIConfig()
		expect(() => cliConfig.loadConfig()).toThrow('config not yet initialized')
	})

	it('getRawConfigData throws error when uninitialized', function() {
		const cliConfig = new CLIConfig()
		expect(() => cliConfig.getRawConfigData()).toThrow('config not initialized completely')

		// sill throws same error when partially initialized
		cliConfig.init(`${resourcesDir}/good-config.yaml`)
		expect(() => cliConfig.getRawConfigData()).toThrow('config not initialized completely')
	})

	it('adds config.yaml to directory for config filename', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init('/my/config/dir/config.yaml')
		expect(cliConfig.configFile).toBe('/my/config/dir/config.yaml')
	})

	it('returns an empty config with no config file', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init('/path/to/no/file/at/all/config.yaml')
		expect(cliConfig.loadConfig()).toMatchObject({})
	})

	it('returns an empty config for empty config file', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init(`${resourcesDir}/empty-config.yaml`)
		expect(cliConfig.loadConfig()).toMatchObject({})
	})

	it('throws error for bad config file', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init(`${resourcesDir}/bad-config.yaml`)
		expect(cliConfig.loadConfig.bind(cliConfig)).toThrow()
	})

	it('throws error for config file with just a string', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init(`${resourcesDir}/string-config.yaml`)
		expect(() => cliConfig.loadConfig()).toThrow('invalid config file format; please specify zero or more profiles')
	})

	it('getProfile returns profile sub-tree', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init(`${resourcesDir}/good-config.yaml`)
		expect(cliConfig.getProfile('simple')).toMatchObject({key: 'value'})
	})

	it('returns empty config for missing profile', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init(`${resourcesDir}/good-config.yaml`)
		expect(cliConfig.getProfile('does-not-exist')).toMatchObject({})
	})

	it('throws error for bad profile', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init(`${resourcesDir}/good-config.yaml`)
		expect(() => cliConfig.getProfile('bad-profile')).toThrow('bad profile configuration')
	})

	it('throws error for null profile', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init(`${resourcesDir}/good-config.yaml`)
		expect(() => cliConfig.getProfile('null-profile')).toThrow('null profile specified. Check config.yaml for errors.')
	})

	it('getRawConfigData returns raw data', function() {
		const cliConfig = new CLIConfig()
		cliConfig.init(`${resourcesDir}/good-config.yaml`)
		cliConfig.loadConfig()
		const expected = { simple: { key: 'value' }, 'bad-profile': 'not a real profile', 'null-profile': null }
		expect(cliConfig.getRawConfigData()).toEqual(expected)
	})
})
