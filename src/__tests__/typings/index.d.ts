export {}

declare global {
	namespace jest {
		// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
		interface Matchers<R> {
			toHaveLabel(label: string): R
			toHaveValue(value: string): R
			toHaveLabelAndValue(label: string, value: string): R
			toHaveItemValues(values: string[]): R
		}
	}
}
