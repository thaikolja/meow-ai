export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  if (!body?.password || !body?.username) {
    throw createError({
      statusCode: 400,
      message: 'Username and password are required'
    })
  }

  if (body.password !== config.appPassword) {
    throw createError({
      statusCode: 401,
      message: 'Invalid password'
    })
  }

  // Set the 7-day cookie
  setCookie(event, 'chat_username', body.username, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: false, // Must be false so Nuxt client can read it for UI dynamically
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  })

  return {
    success: true,
    username: body.username
  }
})
