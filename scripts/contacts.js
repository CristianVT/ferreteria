// Sistema de gestión de contactos
class ContactsSystem {
  constructor() {
    this.contacts = JSON.parse(localStorage.getItem("contacts")) || []
    this.nextContactId = Number.parseInt(localStorage.getItem("nextContactId")) || 1
    this.init()
  }

  init() {
    this.loadContacts()
    this.setupEventListeners()
  }

  setupEventListeners() {
    const contactForm = document.getElementById("contactForm")
    if (contactForm) {
      contactForm.addEventListener("submit", (e) => {
        e.preventDefault()
        this.saveContact()
      })
    }
  }

  saveContact() {
    const contactData = {
      id: document.getElementById("contactId").value || this.nextContactId++,
      name: document.getElementById("contactName").value,
      company: document.getElementById("contactCompany").value,
      type: document.getElementById("contactType").value,
      phone: document.getElementById("contactPhone").value,
      email: document.getElementById("contactEmail").value,
      address: document.getElementById("contactAddress").value,
      createdDate: new Date().toISOString().split("T")[0],
    }

    if (!this.validateContact(contactData)) {
      return
    }

    const existingIndex = this.contacts.findIndex((c) => c.id == contactData.id)

    if (existingIndex >= 0) {
      this.contacts[existingIndex] = contactData
    } else {
      this.contacts.push(contactData)
    }

    this.saveToStorage()
    this.loadContacts()
    window.closeModal("contactModal") // Declare closeModal before using it
    this.resetContactForm()

    alert("Contacto guardado exitosamente")
  }

  validateContact(contact) {
    if (!contact.name || !contact.type || !contact.phone || !contact.email) {
      alert("Por favor, complete todos los campos obligatorios")
      return false
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contact.email)) {
      alert("Por favor, ingrese un email válido")
      return false
    }

    return true
  }

  loadContacts() {
    const tbody = document.getElementById("contactsTableBody")
    if (!tbody) return

    tbody.innerHTML = ""

    this.contacts.forEach((contact) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${contact.name}</td>
                <td>${contact.company || "-"}</td>
                <td>${contact.type}</td>
                <td>${contact.phone}</td>
                <td>${contact.email}</td>
                <td>${contact.address || "-"}</td>
                <td>
                    <button class="btn btn-warning" onclick="editContact(${contact.id})">Editar</button>
                    <button class="btn btn-danger" onclick="deleteContact(${contact.id})">Eliminar</button>
                </td>
            `
      tbody.appendChild(row)
    })
  }

  saveToStorage() {
    localStorage.setItem("contacts", JSON.stringify(this.contacts))
    localStorage.setItem("nextContactId", this.nextContactId.toString())
  }

  resetContactForm() {
    document.getElementById("contactForm").reset()
    document.getElementById("contactId").value = ""
    document.getElementById("contactModalTitle").textContent = "Agregar Contacto"
  }
}

// Funciones globales
function editContact(id) {
  const contact = contacts.contacts.find((c) => c.id == id)
  if (!contact) return

  document.getElementById("contactId").value = contact.id
  document.getElementById("contactName").value = contact.name
  document.getElementById("contactCompany").value = contact.company || ""
  document.getElementById("contactType").value = contact.type
  document.getElementById("contactPhone").value = contact.phone
  document.getElementById("contactEmail").value = contact.email
  document.getElementById("contactAddress").value = contact.address || ""
  document.getElementById("contactModalTitle").textContent = "Editar Contacto"

  window.openModal("contactModal") // Declare openModal before using it
}

function deleteContact(id) {
  if (confirm("¿Está seguro de eliminar este contacto?")) {
    contacts.contacts = contacts.contacts.filter((c) => c.id != id)
    contacts.saveToStorage()
    contacts.loadContacts()
  }
}

function filterContacts() {
  const searchTerm = document.getElementById("searchContact").value.toLowerCase()
  const typeFilter = document.getElementById("typeFilter").value

  const rows = document.querySelectorAll("#contactsTableBody tr")

  rows.forEach((row) => {
    const name = row.cells[0].textContent.toLowerCase()
    const company = row.cells[1].textContent.toLowerCase()
    const type = row.cells[2].textContent

    const matchesSearch = name.includes(searchTerm) || company.includes(searchTerm)
    const matchesType = !typeFilter || type === typeFilter

    row.style.display = matchesSearch && matchesType ? "" : "none"
  })
}

// Inicializar sistema
let contacts
document.addEventListener("DOMContentLoaded", () => {
  contacts = new ContactsSystem()
})

// Declare closeModal and openModal functions
function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.style.display = "none"
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.style.display = "block"
  }
}
