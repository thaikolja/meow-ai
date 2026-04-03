export default defineNuxtRouteMiddleware((to) => {
  const username = useCookie('chat_username')
  
  if (!username.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  // Prevent logged-in users from seeing the login page
  if (username.value && to.path === '/login') {
    return navigateTo('/')
  }
})
