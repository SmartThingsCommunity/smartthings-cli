---
"@smartthings/cli": patch
---

Fix TypeError crash when running `smartthings` or `smartthings -h` without a subcommand. Yargs passes `undefined` as the error argument to the `.fail()` callback for validation failures; the `in` operator threw when the operand was `undefined`.
