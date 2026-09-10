---
"@smartthings/cli": major
---

Updated to use new smartapps endpoints for managing API Access apps.

* All commands under the old `apps` hierarchy have been renamed to `smartapps`.
* The command to resend a confirmation URL to a Smart App has been renamed from `apps:register` to
  `smartapps:confirm`.
* Lambda and Webhook Smart Apps can no longer be created or updated. Related commands have been removed.
* OAuth-In Smart Apps are now referred to as API Access Smart Apps.
* When creating an API Access Smart App, an account/organization id is now associated with the Smart App.
  If the user has access to more than one organization, they will be prompted for which to use.
* Two new fields are available for API Access Smart Apps:
	* privacyPolicyUrl (required for business accounts)
	* corsDomains

Improved error messages when input or output is non-interactive and user does not specify everything on the command line.
