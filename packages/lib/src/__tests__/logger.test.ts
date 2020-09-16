import { LoggingEvent } from 'log4js'

import { Logger } from '@smartthings/core-sdk'

import { logManager } from '../logger'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const recording = require('log4js/lib/appenders/recording')


describe('logger', () => {
	function setupLogManager(level: string): void {
		const config = {
			appenders: { main: { type: 'recording' } },
			categories: { default: { appenders: ['main'], level } },
		}
		logManager.init(config)
	}

	function logOneOfEach(log: Logger): LoggingEvent[] {
		log.trace('trace message')
		log.debug('debug message')
		log.info('info message')
		log.warn('warn message')
		log.error('error message')
		log.fatal('fatal message')

		return recording.replay()
	}

	afterEach(() => {
		recording.erase()
		jest.clearAllMocks()
	})

	describe('logManager', () => {
		// This test has to be first so logging hasn't been initialized for it.
		it('getLogger throws exception if not initialized', function() {
			expect(() => logManager.getLogger('my-category')).toThrow('logging not initialized')
		})

		it('returns the same logger for the same name', function() {
			setupLogManager('error')
			const one = logManager.getLogger('my-category')
			const two = logManager.getLogger('my-category')
			expect(one).toBe(two)
		})

		it('returns different loggers for different names', function() {
			setupLogManager('error')
			const one = logManager.getLogger('my-category')
			const two = logManager.getLogger('your-category')
			expect(one).not.toBe(two)
		})

		it('level returns correct level', function() {
			setupLogManager('error')
			const log = logManager.getLogger('my-category')

			expect(log.level).toBe('ERROR')

			setupLogManager('warn')
			expect(log.level).toBe('WARN')
		})

		it('level sets the level correctly', function() {
			setupLogManager('error')
			const log = logManager.getLogger('my-category')

			expect(log.level).toBe('ERROR')

			log.level = 'warn'
			expect(log.level).toBe('WARN')
		})

		it('logs correctly when level is trace', function() {
			setupLogManager('trace')
			const log = logManager.getLogger('my-category')
			const logEvents = logOneOfEach(log)

			expect(logEvents.length).toBe(6)
		})

		it('logs correctly when level is warn', function() {
			setupLogManager('warn')
			const log = logManager.getLogger('my-category')
			const logEvents = logOneOfEach(log)

			expect(logEvents.length).toBe(3)
			expect(logEvents.map(event => event.level.levelStr)).toEqual(['WARN', 'ERROR', 'FATAL'])
		})

		it('is<Level>Enabled returns correct value when level is trace', function() {
			setupLogManager('trace')
			const log = logManager.getLogger('my-category')
			expect(log.isTraceEnabled()).toBe(true)
			expect(log.isDebugEnabled()).toBe(true)
			expect(log.isInfoEnabled()).toBe(true)
			expect(log.isWarnEnabled()).toBe(true)
			expect(log.isErrorEnabled()).toBe(true)
			expect(log.isFatalEnabled()).toBe(true)
		})

		it('is<Level>Enabled returns correct value when level is warn', function() {
			setupLogManager('warn')
			const log = logManager.getLogger('my-category')
			expect(log.isTraceEnabled()).toBe(false)
			expect(log.isDebugEnabled()).toBe(false)
			expect(log.isInfoEnabled()).toBe(false)
			expect(log.isWarnEnabled()).toBe(true)
			expect(log.isErrorEnabled()).toBe(true)
			expect(log.isFatalEnabled()).toBe(true)
		})

		it('is<Level>Enabled returns correct value when level is error', function() {
			setupLogManager('error')
			const log = logManager.getLogger('my-category')
			expect(log.isTraceEnabled()).toBe(false)
			expect(log.isDebugEnabled()).toBe(false)
			expect(log.isInfoEnabled()).toBe(false)
			expect(log.isWarnEnabled()).toBe(false)
			expect(log.isErrorEnabled()).toBe(true)
			expect(log.isFatalEnabled()).toBe(true)
		})
	})
})
