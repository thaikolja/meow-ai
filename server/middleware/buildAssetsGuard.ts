import { isBareBuildAssetsPath } from '../utils/buildAssetsGuard'

export default defineEventHandler((event) => {
  const pathname = getRequestURL(event).pathname

  if (!isBareBuildAssetsPath(pathname)) {
    return
  }

  setResponseStatus(event, 404, 'Not Found')
  setResponseHeaders(event, {
    'Cache-Control': 'no-store',
    'Content-Type':  'text/plain; charset=utf-8',
    'X-Robots-Tag':  'noindex'
  })

  return 'Not found'
})
