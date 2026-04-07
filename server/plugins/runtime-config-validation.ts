import { assertProductionRuntimeSecrets } from '../utils/runtimeConfigValidation'

export default defineNitroPlugin(() => {
  assertProductionRuntimeSecrets(useRuntimeConfig())
})
