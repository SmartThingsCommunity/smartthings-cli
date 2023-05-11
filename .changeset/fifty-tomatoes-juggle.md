---
"@smartthings/cli": patch
"@smartthings/plugin-cli-edge": patch
---

edge:channels:unenroll
  * don't include hubs not enrolled in any channel when asking user for a hub
  * present only enrolled channels when asking the user to choose a channel
