import {describe, expect, test} from 'bun:test';

import {isBareBuildAssetsPath} from '../server/utils/buildAssetsGuard';

describe('buildAssetsGuard', () => {
  test('matches only the bare Nuxt asset directory path', () => {
    expect(isBareBuildAssetsPath('/_nuxt')).toBe(true);
    expect(isBareBuildAssetsPath('/_nuxt/')).toBe(true);
    expect(isBareBuildAssetsPath('/_nuxt/app.js')).toBe(false);
    expect(isBareBuildAssetsPath('/_nuxt/builds/meta/test.json')).toBe(false);
    expect(isBareBuildAssetsPath('/favicon.svg')).toBe(false);
  });
});
