// Sistema de autenticación simple
class AuthSystem {
  constructor() {
    this.users = JSON.parse(localStorage.getItem("users")) || [
      { id: 1, username: "admin", password: "admin123", role: "administrador", createdDate: "2024-01-01" },
      { id: 2, username: "empleado", password: "empleado123", role: "empleado", createdDate: "2024-01-01" },
    ]
    this.nextUserId = Number.parseInt(localStorage.getItem("nextUserId")) || 3
    this.currentUser = null
    this.saveUsers() // Guardar usuarios por defecto
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
    const protectedPages = ["inventario.html", "contactos.html", "boletas.html", "registro.html", "usuarios.html"]

    if (protectedPages.includes(currentPage) && !this.currentUser) {
      window.location.href = "index.html"
    }

    // Verificar permisos para página de usuarios
    if (currentPage === "usuarios.html" && this.currentUser && this.currentUser.role !== "administrador") {
      alert("No tienes permisos para acceder a esta página")
      window.location.href = "inventario.html"
    }

    // Si estamos en index.html y ya estamos autenticados, redirigir
    if (currentPage === "index.html" && this.currentUser) {
      window.location.href = "inventario.html"
    }
  }

  getCurrentUser() {
    return this.currentUser
  }

  isAdmin() {
    return this.currentUser && this.currentUser.role === "administrador"
  }

  createUser(userData) {
    // Verificar permisos
    if (!this.isAdmin()) {
      throw new Error("No tienes permisos para crear usuarios")
    }

    // Verificar que el username no exista
    if (this.users.find((u) => u.username === userData.username)) {
      throw new Error("El nombre de usuario ya existe")
    }

    const newUser = {
      id: this.nextUserId++,
      username: userData.username,
      password: userData.password,
      role: userData.role,
      createdDate: new Date().toISOString().split("T")[0],
      createdBy: this.currentUser.username,
    }

    this.users.push(newUser)
    this.saveUsers()
    return newUser
  }

  updateUser(userId, userData) {
    if (!this.isAdmin()) {
      throw new Error("No tienes permisos para actualizar usuarios")
    }

    const userIndex = this.users.findIndex((u) => u.id == userId)
    if (userIndex === -1) {
      throw new Error("Usuario no encontrado")
    }

    // No permitir cambiar el username del admin principal
    if (this.users[userIndex].id === 1 && userData.username !== "admin") {
      throw new Error("No se puede cambiar el username del administrador principal")
    }

    this.users[userIndex] = { ...this.users[userIndex], ...userData }
    this.saveUsers()
    return this.users[userIndex]
  }

  deleteUser(userId) {
    if (!this.isAdmin()) {
      throw new Error("No tienes permisos para eliminar usuarios")
    }

    // No permitir eliminar el admin principal
    if (userId == 1) {
      throw new Error("No se puede eliminar el administrador principal")
    }

    // No permitir que se elimine a sí mismo
    if (userId == this.currentUser.id) {
      throw new Error("No puedes eliminarte a ti mismo")
    }

    this.users = this.users.filter((u) => u.id != userId)
    this.saveUsers()
  }

  saveUsers() {
    localStorage.setItem("users", JSON.stringify(this.users))
    localStorage.setItem("nextUserId", this.nextUserId.toString())
  }

  getAllUsers() {
    return this.users
  }
}

// Instancia global del sistema de autenticación
const auth = new AuthSystem()
window.auth = auth // Hacer disponible globalmente

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
