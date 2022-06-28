---
"@smartthings/cli": patch
"@smartthings/cli-lib": patch
---

Update table output:
	- switch to table package which handles international characters properly
	- removed compact / expanded command line options
	- removed compactTableOutput configuration option
	- added group-rows and no-group-rows command line options
	- added groupTableOutputRows configuration option
	- (lib) completely isolated use of dependency to table-generator.ts
