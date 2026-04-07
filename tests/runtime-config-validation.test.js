import {describe, expect, test} from 'bun:test';

import {assertProductionRuntimeSecrets} from '../server/utils/runtimeConfigValidation';

describe('runtimeConfigValidation', () => {
  test('allows missing app password outside production', () => {
    expect(() => assertProductionRuntimeSecrets({}, 'development')).not.toThrow();
  });

  test('requires app password in production', () => {
    expect(() => assertProductionRuntimeSecrets({}, 'production')).
        toThrow('NUXT_APP_PASSWORD environment variable is required in production');
  });

  test('accepts a trimmed app password in production', () => {
    expect(() => assertProductionRuntimeSecrets({appPassword: '  meow-secret  '}, 'production')).not.toThrow();
  });
});
