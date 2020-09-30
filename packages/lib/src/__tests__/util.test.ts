import { applyMixins } from '../util'


describe('util', () => {
	describe('applyMixins', () => {
		const SOMETHING = 'something'
		const SOMETHING_ELSE = 'something else'

		// constructor functions
		const Target = jest.fn()
		const ChildTarget = jest.fn()
		const Mixin1 = jest.fn()
		const Mixin2 = jest.fn()
		const Mixin3 = jest.fn()
		const Mixin4 = jest.fn()

		beforeEach(() => {
			Target.prototype = {
				property: SOMETHING,

				constructor: Target,

				method() {
					return SOMETHING
				},

				async asyncMethod() {
					return SOMETHING
				},
			}

			ChildTarget.prototype = Object.create(Target.prototype)
			ChildTarget.prototype.constructor = ChildTarget
			ChildTarget.prototype.childMethod = () => SOMETHING

			Mixin1.prototype = {
				property1: SOMETHING,

				constructor: Mixin1,

				async asyncMethod() {
					return SOMETHING_ELSE
				},

				method1() {
					return SOMETHING
				},
			}

			Mixin2.prototype = {
				property: SOMETHING_ELSE,
				property2: SOMETHING,

				method() {
					return SOMETHING_ELSE
				},

				method2() {
					return SOMETHING
				},
			}

			Mixin3.prototype = {
				method() {
					return SOMETHING
				},
			}

			Mixin4.prototype = {
				// purposefully not async to cause Error when merging with another async method
				asyncMethod() {
					return SOMETHING
				},
			}
		})

		afterEach(() => {
			jest.clearAllMocks()
		})

		test('target classes setup correctly', () => {
			const target = new Target()

			expect(target).toBeInstanceOf(Target)
			expect(target.constructor).toStrictEqual(Target)
			expect(Target.prototype.constructor).toStrictEqual(Target)

			const childTarget = new ChildTarget()

			expect(childTarget).toBeInstanceOf(ChildTarget)
			expect(childTarget).toBeInstanceOf(Target)
			expect(childTarget.constructor).toStrictEqual(ChildTarget)
			expect(ChildTarget.prototype.constructor).toStrictEqual(ChildTarget)
		})

		it('should mix a simple property into target class', () => {
			applyMixins(Target, [Mixin1])
			const target = new Target()

			expect(target.property).toBe(SOMETHING)
			expect(target.property1).toBe(SOMETHING)
		})

		it('should mix properties from multiple mixins into target class, overriding any duplicate names', () => {
			applyMixins(Target, [Mixin1, Mixin2])
			const target = new Target()

			expect(target.property).toBe(SOMETHING_ELSE)
			expect(target.property1).toBe(SOMETHING)
			expect(target.property2).toBe(SOMETHING)
		})

		it('should mix a simple method into target class', () => {
			applyMixins(Target, [Mixin1])
			const target = new Target()

			expect(target.method()).toBe(SOMETHING)
			expect(target.method1()).toBe(SOMETHING)
		})

		it('should mix methods from multiple mixins into target class, overriding any duplicate names', async () => {
			const targetMethodSpy = jest.spyOn(Target.prototype, 'method')
			const targetAsyncMethodSpy = jest.spyOn(Target.prototype, 'asyncMethod')

			applyMixins(Target, [Mixin1, Mixin2])
			const target = new Target()

			expect(target.method()).toBe(SOMETHING_ELSE)
			expect(await target.asyncMethod()).toBe(SOMETHING_ELSE)
			expect(target.method1()).toBe(SOMETHING)
			expect(target.method2()).toBe(SOMETHING)

			expect(targetMethodSpy).toBeCalledTimes(0)
			expect(targetAsyncMethodSpy).toBeCalledTimes(0)
		})

		it('should mixin a method that calls matching methods in order when mergeFunctions = true', () => {
			const targetMethodSpy = jest.spyOn(Target.prototype, 'method')
			const mixin2MethodSpy = jest.spyOn(Mixin2.prototype, 'method')
			const mixin3MethodSpy = jest.spyOn(Mixin3.prototype, 'method')

			applyMixins(Target, [Mixin2, Mixin3], { mergeFunctions: true })
			const target = new Target()

			expect(target.method()).toBe(SOMETHING)
			expect(targetMethodSpy).toBeCalledTimes(1)
			expect(mixin2MethodSpy).toBeCalledTimes(1)
			expect(mixin3MethodSpy).toBeCalledTimes(1)

			const targetCallOrder = targetMethodSpy.mock.invocationCallOrder[0]
			const mixin2CallOrder = mixin2MethodSpy.mock.invocationCallOrder[0]
			const mixin3CallOrder = mixin3MethodSpy.mock.invocationCallOrder[0]

			expect(targetCallOrder).toBeLessThan(mixin2CallOrder)
			expect(mixin2CallOrder).toBeLessThan(mixin3CallOrder)
		})

		it('should mixin an async method that calls matching async methods in order when mergeFunctions = true', async () => {
			// not spying on async functions here, as jest fn/spies constructor.name is always Function, not AsyncFunction
			// we cannot verify call order of async merge because of this

			applyMixins(Target, [Mixin1], { mergeFunctions: true })
			const target = new Target()

			expect(await target.asyncMethod()).toBe(SOMETHING_ELSE)
		})

		it('should throw error when mergeFunctions = true and matching methods are mix of async/sync', async () => {
			expect(() => {
				applyMixins(Target, [Mixin4], { mergeFunctions: true })
			}).toThrowError()
		})

		it('should not override target class inherited methods when mergeFunctions = true', () => {
			const targetMethodSpy = jest.spyOn(Target.prototype, 'method')
			const mixin2MethodSpy = jest.spyOn(Mixin2.prototype, 'method')

			applyMixins(ChildTarget, [Mixin2], { mergeFunctions: true })
			const childTarget = new ChildTarget()

			expect(childTarget.method()).toBe(SOMETHING_ELSE)
			expect(targetMethodSpy).toBeCalledTimes(1)
			expect(mixin2MethodSpy).toBeCalledTimes(1)

			const targetCallOrder = targetMethodSpy.mock.invocationCallOrder[0]
			const mixin2CallOrder = mixin2MethodSpy.mock.invocationCallOrder[0]

			expect(targetCallOrder).toBeLessThan(mixin2CallOrder)
		})

		it('should override target class constructor if a mixin constructor exists', () => {
			applyMixins(Target, [Mixin1])

			expect(Target.prototype.constructor).toStrictEqual(Mixin1.prototype.constructor)
		})
	})
})
