type RuntimeSecretConfig = {
  appPassword?: string
}

export function assertProductionRuntimeSecrets(config: RuntimeSecretConfig, nodeEnv = process.env['NODE_ENV'] || '') {
  if (nodeEnv!=='production') {
    return
  }

  if (!config.appPassword?.trim()) {
    throw new Error('NUXT_APP_PASSWORD environment variable is required in production')
  }
}
