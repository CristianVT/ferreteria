// Sistema de autenticación simple
class AuthSystem {
  constructor() {
    this.users = [
      { username: "admin", password: "admin" },
      { username: "usuario", password: "admin" },
    ]
    this.currentUser = null
    this.checkAuth()
  }

  login(username, password) {
    const user = this.users.find((u) => u.username === username && u.password === password)
    if (user) {
      this.currentUser = user
      localStorage.setItem("currentUser", JSON.stringify(user))
      return true
    }
    return false
  }

  logout() {
    this.currentUser = null
    localStorage.removeItem("currentUser")
    window.location.href = "index.html"
  }

  checkAuth() {
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser)
    }

    // Verificar si estamos en una página protegida
    const currentPage = window.location.pathname.split("/").pop()
    const protectedPages = ["inventario.html", "contactos.html", "boletas.html", "registro.html"]

    if (protectedPages.includes(currentPage) && !this.currentUser) {
      window.location.href = "index.html"
    }

    // Si estamos en index.html y ya estamos autenticados, redirigir
    if (currentPage === "index.html" && this.currentUser) {
      window.location.href = "inventario.html"
    }
  }

  getCurrentUser() {
    return this.currentUser
  }
}

// Instancia global del sistema de autenticación
const auth = new AuthSystem()

// Función para cerrar sesión
function logout() {
  auth.logout()
}

// Manejo del formulario de login
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const username = document.getElementById("usuario").value
      const password = document.getElementById("contrasena").value
      const errorDiv = document.getElementById("loginError")

      if (auth.login(username, password)) {
        window.location.href = "inventario.html"
      } else {
        errorDiv.style.display = "block"
        setTimeout(() => {
          errorDiv.style.display = "none"
        }, 3000)
      }
    })
  }
})
