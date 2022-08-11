---
"@smartthings/cli-lib": patch
"@smartthings/cli-testlib": patch
---

clean-up refactor of command helper functions (functions we use to do most of the work for most of our commands like `selectFromList` and `formatAndWriteItem`)

* made the `Sorting` interface generic, dependent on the type of the object being sorted
* changed type of `primaryKeyName` and `sortingKeyName` for `Sorting` interface to constrain them to string keys from the object being sorted
* added `extends object` constraint to objects handled by command helper functions
* rename `outputListing` to `outputItemOrList` and `outputListingGeneric` to `outputItemOrListGeneric`
* update/add config types for command helper functions with consistent naming (`InputAndOutputItemConfig` for `inputAndOutputItem`, `FormatAndWriteItemConfig` for `formatAndWriteItem`, etc.)
