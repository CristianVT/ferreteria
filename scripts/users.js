// Sistema de gestión de usuarios
class UsersSystem {
  constructor(auth) {
    this.auth = auth
    this.init()
  }

  init() {
    this.loadUsers()
    this.loadCurrentUserInfo()
    this.setupEventListeners()
  }

  setupEventListeners() {
    // Formulario de usuario
    const userForm = document.getElementById("userForm")
    if (userForm) {
      userForm.addEventListener("submit", (e) => {
        e.preventDefault()
        this.saveUser()
      })
    }

    // Formulario de cambio de contraseña
    const passwordForm = document.getElementById("passwordForm")
    if (passwordForm) {
      passwordForm.addEventListener("submit", (e) => {
        e.preventDefault()
        this.changePassword()
      })
    }
  }

  loadCurrentUserInfo() {
    const currentUser = this.auth.getCurrentUser()
    if (currentUser) {
      document.getElementById("currentUsername").textContent = currentUser.username
      document.getElementById("currentUserRole").textContent = currentUser.role
    }
  }

  saveUser() {
    const userId = document.getElementById("userId").value
    const username = document.getElementById("username").value
    const password = document.getElementById("password").value
    const confirmPassword = document.getElementById("confirmPassword").value
    const role = document.getElementById("userRole").value

    // Validaciones
    if (!this.validateUserForm(username, password, confirmPassword, role)) {
      return
    }

    try {
      const userData = {
        username: username,
        password: password,
        role: role,
      }

      if (userId) {
        // Actualizar usuario existente
        this.auth.updateUser(userId, userData)
        alert("Usuario actualizado exitosamente")
      } else {
        // Crear nuevo usuario
        this.auth.createUser(userData)
        alert("Usuario creado exitosamente")
      }

      this.loadUsers()
      closeModal("userModal")
      this.resetUserForm()
    } catch (error) {
      alert("Error: " + error.message)
    }
  }

  validateUserForm(username, password, confirmPassword, role) {
    if (!username || username.length < 3) {
      alert("El nombre de usuario debe tener al menos 3 caracteres")
      return false
    }

    if (!password || password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres")
      return false
    }

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden")
      return false
    }

    if (!role) {
      alert("Por favor, seleccione un rol")
      return false
    }

    // Validar caracteres especiales en username
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      alert("El nombre de usuario solo puede contener letras, números y guiones bajos")
      return false
    }

    return true
  }

  changePassword() {
    const userId = document.getElementById("passwordUserId").value
    const newPassword = document.getElementById("newPassword").value
    const confirmNewPassword = document.getElementById("confirmNewPassword").value

    if (!newPassword || newPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (newPassword !== confirmNewPassword) {
      alert("Las contraseñas no coinciden")
      return
    }

    try {
      this.auth.updateUser(userId, { password: newPassword })
      alert("Contraseña cambiada exitosamente")
      closeModal("passwordModal")
      document.getElementById("passwordForm").reset()
    } catch (error) {
      alert("Error: " + error.message)
    }
  }

  loadUsers() {
    const tbody = document.getElementById("usersTableBody")
    if (!tbody) return

    tbody.innerHTML = ""

    const users = this.auth.getAllUsers()

    users.forEach((user) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td><span class="role-${user.role}">${user.role}</span></td>
                <td>${user.createdDate}</td>
                <td>${user.createdBy || "Sistema"}</td>
                <td>
                    <button class="btn btn-warning" onclick="editUser(${user.id})" ${user.id === 1 ? "disabled" : ""}>Editar</button>
                    <button class="btn btn-secondary" onclick="openPasswordModal(${user.id})">Cambiar Contraseña</button>
                    <button class="btn btn-danger" onclick="deleteUser(${user.id})" ${user.id === 1 || user.id === this.auth.getCurrentUser().id ? "disabled" : ""}>Eliminar</button>
                </td>
            `
      tbody.appendChild(row)
    })
  }

  resetUserForm() {
    document.getElementById("userForm").reset()
    document.getElementById("userId").value = ""
    document.getElementById("userModalTitle").textContent = "Crear Usuario"
  }
}

// Funciones globales
function openModal(modalId) {
  document.getElementById(modalId).style.display = "block"
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none"
}

function editUser(id) {
  const users = window.auth.getAllUsers()
  const user = users.find((u) => u.id == id)
  if (!user) return

  document.getElementById("userId").value = user.id
  document.getElementById("username").value = user.username
  document.getElementById("password").value = user.password
  document.getElementById("confirmPassword").value = user.password
  document.getElementById("userRole").value = user.role
  document.getElementById("userModalTitle").textContent = "Editar Usuario"

  openModal("userModal")
}

function openPasswordModal(id) {
  document.getElementById("passwordUserId").value = id
  document.getElementById("passwordForm").reset()
  openModal("passwordModal")
}

function deleteUser(id) {
  const users = window.auth.getAllUsers()
  const user = users.find((u) => u.id == id)

  if (!user) return

  if (confirm(`¿Está seguro de eliminar al usuario "${user.username}"?`)) {
    try {
      window.auth.deleteUser(id)
      usersSystem.loadUsers()
      alert("Usuario eliminado exitosamente")
    } catch (error) {
      alert("Error: " + error.message)
    }
  }
}

function filterUsers() {
  const searchTerm = document.getElementById("searchUser").value.toLowerCase()
  const roleFilter = document.getElementById("roleFilter").value

  const rows = document.querySelectorAll("#usersTableBody tr")

  rows.forEach((row) => {
    const username = row.cells[1].textContent.toLowerCase()
    const role = row.cells[2].textContent.trim()

    const matchesSearch = username.includes(searchTerm)
    const matchesRole = !roleFilter || role === roleFilter

    row.style.display = matchesSearch && matchesRole ? "" : "none"
  })
}

// Inicializar sistema
let usersSystem
document.addEventListener("DOMContentLoaded", () => {
  usersSystem = new UsersSystem(window.auth)
})
