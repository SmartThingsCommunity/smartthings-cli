import { applyMixins } from '../util'


describe('util', () => {
	describe('applyMixins', () => {
		const SOMETHING = 'something'
		const SOMETHING_ELSE = 'something else'

		const Target = jest.fn()

		const Mixin1 = jest.fn()

		const Mixin2 = jest.fn()

		beforeEach(() => {
			Target.prototype = {
				constructor: Target,

				method() {
					return SOMETHING
				},
			}

			Mixin1.prototype = {
				method1() {
					return SOMETHING
				},
			}

			Mixin2.prototype = {
				method() {
					return SOMETHING_ELSE
				},

				method2() {
					return SOMETHING
				},
			}
		})

		afterEach(() => {
			jest.clearAllMocks()
		})

		test('target class is setup correctly', () => {
			const target = new Target()

			expect(target).toBeInstanceOf(Target)
			expect(target.constructor).toStrictEqual(Target)
			expect(Target.prototype.constructor).toStrictEqual(Target)
		})

		test.todo('target class should get simple property from a mixin')

		test.todo('target class should get properties from multiple mixins')

		it('should mix a simple method into target class', () => {
			applyMixins(Target, [Mixin1])
			const target = new Target()

			expect(target.method()).toBe(SOMETHING)
			expect(target.method1()).toBe(SOMETHING)
		})

		it('should mix methods from multiple bases into the target class, overriding any duplicate names', () => {
			const targetMethodSpy = jest.spyOn(Target.prototype, 'method')

			applyMixins(Target, [Mixin1, Mixin2])
			const target = new Target()

			expect(target.method()).toBe(SOMETHING_ELSE)
			expect(target.method1()).toBe(SOMETHING)
			expect(target.method2()).toBe(SOMETHING)

			expect(targetMethodSpy).toBeCalledTimes(0)
		})

		it('should mixin a method that calls matching methods in order when mergeFunctions = true', () => {
			const targetMethodSpy = jest.spyOn(Target.prototype, 'method')
			const mixin2MethodSpy = jest.spyOn(Mixin2.prototype, 'method')

			applyMixins(Target, [Mixin1, Mixin2], { mergeFunctions: true })
			const target = new Target()

			expect(target.method()).toBe(SOMETHING_ELSE)
			expect(targetMethodSpy).toHaveBeenCalled()
			expect(mixin2MethodSpy).toHaveBeenCalled()

			const targetCallOrder = targetMethodSpy.mock.invocationCallOrder[0]
			const mixin2CallOrder = mixin2MethodSpy.mock.invocationCallOrder[0]

			expect(targetCallOrder).toBeLessThan(mixin2CallOrder)
		})

		// make a target class that inherits a method from a parent class
		// attempt to mixin a class with a matching method name
		// verify that this is not overridden and is called in order
		test.todo('target class inherited methods should not be overridden on merge')

		test.todo('target constructor should be overridden by any mixin constructors')

		test.todo('merge functions with non matching args?')
	})
})
