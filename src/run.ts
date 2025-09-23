import { buildInstance } from './index.js'


// After bundling with ncc, we get deprecation warnings from axios. Turn them off for now.
(process as unknown as { noDeprecation: boolean }).noDeprecation = true

await buildInstance().parse()
