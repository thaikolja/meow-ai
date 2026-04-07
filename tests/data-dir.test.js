import {describe, expect, test} from 'bun:test';

import {resolveDataDirPath} from '../server/utils/dataDir';

describe('dataDir', () => {
  test('prefers the configured data directory over the current working directory', () => {
    expect(resolveDataDirPath('/tmp/meow-data', '/tmp/app/.output')).toBe('/tmp/meow-data');
  });

  test('falls back to cwd/.data when no explicit directory is configured', () => {
    expect(resolveDataDirPath(undefined, '/tmp/app/.output')).toBe('/tmp/app/.output/.data');
  });
});
