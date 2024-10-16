export type GetDataFunction<O extends object> = () => Promise<O>
export type ListDataFunction<L extends object> = () => Promise<L[]>
export type LookupDataFunction<ID, O extends object> = (id: ID) => Promise<O>
export type ActionFunction<ID, I extends object, O extends object = I> =
	(id: ID, input: I) => Promise<O>
export type IdTranslationFunction<ID, L extends object> =
	(idOrIndex: ID | string, listFunction: ListDataFunction<L>) => Promise<ID>
export type IdRetrievalFunction<ID, L extends object> =
	(fieldInfo: Sorting<L>, list: L[], promptMessage?: string) => Promise<ID>


/**
 * This interface is used when a list is presented to the user, especially when they will have the
 * opportunity to select an item from the list.
 *
 * The primary (but not only) example of this the list/get versions of commands. Consider the
 * simple `locations` command. When specified without an id or index, it needs to present the
 * results in a consistent order. If the user specifies an index into that list when querying
 * a single location, the sort key specified here is used again to ensure the same ordering.
 */
export type Sorting<L extends object> = {
	/**
	 * The primary key used to uniquely identify this object.
	 */
	primaryKeyName: Extract<keyof L, string>

	/**
	 * The field you want to sort by when presenting a list of items.
	 */
	sortKeyName?: Extract<keyof L, string>
}

/**
 * This interface is used in configurations to help describe a named item.
 *
 * If you're writing code that uses this interface, use `itemName` or `pluralItemName` from
 * command-util to translate a `Naming` instance to a name.
 */
export type Naming = {
	/**
	 * The singular name of your item, using lowercase letters and spaces to separate words.
	 */
	itemName?: string

	/**
	 * You only need to specify the plural version of your name if adding a simple "s" is incorrect.
	 */
	pluralItemName?: string
}
