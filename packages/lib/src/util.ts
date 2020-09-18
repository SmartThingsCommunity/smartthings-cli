/**
 * Options for use in the applyMixin function.
 */
export interface MixinOptions {
	/**
	 * When a function (non-constructor) with the same name exists in more
	 * than one mixin or the derived class, call them all. The derived class
	 * function is called first followed by the functions from the mixins in
	 * order passed to `applyMixins`. Note that no attempt is made to verify
	 * arguments. This should only be used when functions of the same name
	 * use the same arguments.
	 *
	 * The default behavior is to call the last one defined.
	 */
	mergeFunctions?: boolean
}

/**
 * Create a function that calls both of the given functions in order.
 */
function mergeFunctions(name: string,
		baseFunctionPropertyDescriptor: PropertyDescriptor,
		mergingFunctionPropertyDescriptor: PropertyDescriptor,
		into: PropertyDescriptor): void {
	const baseFunction = baseFunctionPropertyDescriptor.value
	const mergingFunction = mergingFunctionPropertyDescriptor.value
	if (baseFunction.constructor.name === 'Function' && mergingFunction.constructor.name === 'Function') {
		into.value = function (this, ...args: unknown[]) {
			// call pre-existing function and then new one
			baseFunction.apply(this, args)
			return mergingFunction.apply(this, args)
		}
	} else if (baseFunction.constructor.name === 'AsyncFunction' && mergingFunction.constructor.name === 'AsyncFunction') {
		into.value = async function (this, ...args: unknown[]) {
			// call pre-existing function and then new one
			await baseFunction.apply(this, args)
			return await mergingFunction.apply(this, args)
		}
	} else {
		throw new Error(`${name} function a mix of async and sync functions`)
	}
}

/**
 * Given a class and a set of mixin classes, apply the mixins to the base
 * class.
 *
 * Based on: https://www.typescriptlang.org/docs/handbook/mixins.html#alternative-pattern
 * but extended to make some (rather rudimentary) attempt to combine multiple functions
 * rather than just overwriting them.
 *
 * @param derivedCtor The class to which the mixins should be applied.
 * @param baseCtors The mixin classes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyMixins(derivedCtor: any, baseCtors: any[], options?: MixinOptions): void {
	baseCtors.forEach(baseCtor => {
		Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
			const derivedPropertyDescriptor = Object.getOwnPropertyDescriptor(derivedCtor.prototype, name)
			const propertyDescriptor = Object.getOwnPropertyDescriptor(baseCtor.prototype, name)
			const newPropertyDescriptor: PropertyDescriptor = { ...propertyDescriptor }
			if (options?.mergeFunctions && name !== 'constructor') {
				if (typeof propertyDescriptor?.value === 'function' && typeof derivedPropertyDescriptor?.value === 'function') {
					mergeFunctions(name, derivedPropertyDescriptor, propertyDescriptor, newPropertyDescriptor)
				} else {
					// see if there are any matching methods in parent classes so
					// we don't overwrite them
					let parentPrototype = Object.getPrototypeOf(derivedCtor.prototype)
					let merged = false
					while (!merged && parentPrototype) {
						const parentPropertyDescriptor = Object.getOwnPropertyDescriptor(parentPrototype, name)

						if (typeof propertyDescriptor?.value === 'function' && typeof parentPropertyDescriptor?.value === 'function') {
							mergeFunctions(name, parentPropertyDescriptor, propertyDescriptor, newPropertyDescriptor)
							merged = true
						} else {
							parentPrototype = Object.getPrototypeOf(parentPrototype)
						}
					}
				}
			}
			Object.defineProperty(derivedCtor.prototype, name, newPropertyDescriptor)
		})
	})
}
