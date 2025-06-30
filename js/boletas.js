// Sistema de gestión de boletas
class BoletasSystem {
  constructor() {
    this.boletas = JSON.parse(localStorage.getItem("boletas")) || []
    this.nextBoletaNumber = Number.parseInt(localStorage.getItem("nextBoletaNumber")) || 1001
    this.currentBoleta = { products: [], total: 0 }
    this.init()
  }

  init() {
    this.loadBoletas()
    this.loadClientsAndProducts()
    this.setupEventListeners()
    this.generateBoletaNumber()
  }

  setupEventListeners() {
    const boletaForm = document.getElementById("boletaForm")
    if (boletaForm) {
      boletaForm.addEventListener("submit", (e) => {
        e.preventDefault()
        this.saveBoleta()
      })
    }
  }

  loadClientsAndProducts() {
    // Cargar clientes
    const clientSelect = document.getElementById("boletaClient")
    const productSelect = document.getElementById("productSelect")

    if (clientSelect) {
      const contacts = JSON.parse(localStorage.getItem("contacts")) || []
      const clients = contacts.filter((c) => c.type === "cliente")

      clientSelect.innerHTML = '<option value="">Seleccionar cliente</option>'
      clients.forEach((client) => {
        clientSelect.innerHTML += `<option value="${client.id}">${client.name}</option>`
      })
    }

    // Cargar productos
    if (productSelect) {
      const products = JSON.parse(localStorage.getItem("products")) || []
      const availableProducts = products.filter((p) => p.status === "disponible" && p.stock > 0)

      productSelect.innerHTML = '<option value="">Seleccionar producto</option>'
      availableProducts.forEach((product) => {
        productSelect.innerHTML += `<option value="${product.id}">${product.name} - S/.${product.price.toFixed(2)} (Stock: ${product.stock})</option>`
      })
    }
  }

  generateBoletaNumber() {
    const boletaNumberInput = document.getElementById("boletaNumber")
    if (boletaNumberInput) {
      boletaNumberInput.value = this.nextBoletaNumber.toString().padStart(6, "0")
    }
  }

  addProductToBoleta() {
    const productSelect = document.getElementById("productSelect")
    const quantityInput = document.getElementById("productQuantity")

    const productId = productSelect.value
    const quantity = Number.parseInt(quantityInput.value)

    if (!productId || !quantity || quantity <= 0) {
      alert("Por favor, seleccione un producto y cantidad válida")
      return
    }

    const products = JSON.parse(localStorage.getItem("products")) || []
    const product = products.find((p) => p.id == productId)

    if (!product) {
      alert("Producto no encontrado")
      return
    }

    if (quantity > product.stock) {
      alert("Cantidad solicitada excede el stock disponible")
      return
    }

    // Verificar si el producto ya está en la boleta
    const existingProduct = this.currentBoleta.products.find((p) => p.id == productId)
    if (existingProduct) {
      existingProduct.quantity += quantity
      existingProduct.subtotal = existingProduct.quantity * existingProduct.price
    } else {
      this.currentBoleta.products.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        subtotal: product.price * quantity,
      })
    }

    this.updateBoletaDisplay()
    productSelect.value = ""
    quantityInput.value = ""
  }

  updateBoletaDisplay() {
    const tbody = document.getElementById("boletaProductsBody")
    const totalSpan = document.getElementById("boletaTotal")

    if (!tbody || !totalSpan) return

    tbody.innerHTML = ""
    let total = 0

    this.currentBoleta.products.forEach((product, index) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${product.name}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.quantity}</td>
                <td>$${product.subtotal.toFixed(2)}</td>
                <td>
                    <button type="button" class="btn btn-danger" onclick="removeProductFromBoleta(${index})">Eliminar</button>
                </td>
            `
      tbody.appendChild(row)
      total += product.subtotal
    })

    this.currentBoleta.total = total
    totalSpan.textContent = total.toFixed(2)
  }

  removeProductFromBoleta(index) {
    this.currentBoleta.products.splice(index, 1)
    this.updateBoletaDisplay()
  }

  saveBoleta() {
    const clientId = document.getElementById("boletaClient").value

    if (!clientId) {
      alert("Por favor, seleccione un cliente")
      return
    }

    if (this.currentBoleta.products.length === 0) {
      alert("Por favor, agregue al menos un producto")
      return
    }

    const contacts = JSON.parse(localStorage.getItem("contacts")) || []
    const client = contacts.find((c) => c.id == clientId)

    const boleta = {
      id: Date.now(),
      number: this.nextBoletaNumber,
      clientId: clientId,
      clientName: client ? client.name : "Cliente no encontrado",
      date: new Date().toISOString().split("T")[0],
      products: [...this.currentBoleta.products],
      total: this.currentBoleta.total,
      status: "pagada",
      createdBy: window.auth.getCurrentUser().username, // Fixed undeclared variable
    }

    // Actualizar stock de productos
    const products = JSON.parse(localStorage.getItem("products")) || []
    const movements = JSON.parse(localStorage.getItem("movements")) || []

    boleta.products.forEach((boletaProduct) => {
      const product = products.find((p) => p.id == boletaProduct.id)
      if (product) {
        const previousStock = product.stock
        product.stock -= boletaProduct.quantity

        // Registrar movimiento
        movements.push({
          productId: product.id,
          productName: product.name,
          type: "salida",
          quantity: boletaProduct.quantity,
          previousStock: previousStock,
          newStock: product.stock,
          reason: "venta",
          date: new Date().toISOString(),
          user: window.auth.getCurrentUser().username,
          reference: `Boleta ${boleta.number}`,
        })
      }
    })

    // Guardar todo
    this.boletas.push(boleta)
    this.nextBoletaNumber++

    localStorage.setItem("boletas", JSON.stringify(this.boletas))
    localStorage.setItem("nextBoletaNumber", this.nextBoletaNumber.toString())
    localStorage.setItem("products", JSON.stringify(products))
    localStorage.setItem("movements", JSON.stringify(movements))

    this.loadBoletas()
    window.closeModal("boletaModal") // Fixed undeclared variable
    this.resetBoletaForm()

    alert(`Boleta ${boleta.number} generada exitosamente`)
  }

  loadBoletas() {
    const tbody = document.getElementById("boletasTableBody")
    if (!tbody) return

    tbody.innerHTML = ""

    this.boletas.forEach((boleta) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${boleta.number.toString().padStart(6, "0")}</td>
                <td>${boleta.clientName}</td>
                <td>${boleta.date}</td>
                <td>$${boleta.total.toFixed(2)}</td>
                <td><span class="status-${boleta.status}">${boleta.status}</span></td>
                <td>
                    <button class="btn btn-primary" onclick="viewBoleta(${boleta.id})">Ver</button>
                    <button class="btn btn-warning" onclick="changeBoletaStatus(${boleta.id})">Cambiar Estado</button>
                </td>
            `
      tbody.appendChild(row)
    })
  }

  resetBoletaForm() {
    this.currentBoleta = { products: [], total: 0 }
    this.generateBoletaNumber()
    this.updateBoletaDisplay()
    document.getElementById("boletaClient").value = ""
  }
}

// Funciones globales
function addProductToBoleta() {
  boletas.addProductToBoleta()
}

function removeProductFromBoleta(index) {
  boletas.removeProductFromBoleta(index)
}

function viewBoleta(id) {
  const boleta = boletas.boletas.find((b) => b.id == id)
  if (!boleta) return

  const detailsDiv = document.getElementById("boletaDetails")
  let productsHtml = ""

  boleta.products.forEach((product) => {
    productsHtml += `
            <tr>
                <td>${product.name}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.quantity}</td>
                <td>$${product.subtotal.toFixed(2)}</td>
            </tr>
        `
  })

  detailsDiv.innerHTML = `
        <div class="boleta-print">
            <h3>Boleta N° ${boleta.number.toString().padStart(6, "0")}</h3>
            <p><strong>Cliente:</strong> ${boleta.clientName}</p>
            <p><strong>Fecha:</strong> ${boleta.date}</p>
            <p><strong>Estado:</strong> ${boleta.status}</p>
            
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Cantidad</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${productsHtml}
                </tbody>
            </table>
            
            <div class="boleta-total">
                <h3>Total: $${boleta.total.toFixed(2)}</h3>
            </div>
        </div>
    `

  window.openModal("viewBoletaModal") // Fixed undeclared variable
}

function changeBoletaStatus(id) {
  const boleta = boletas.boletas.find((b) => b.id == id)
  if (!boleta) return

  const newStatus = prompt("Nuevo estado (pagada/pendiente/anulada):", boleta.status)
  if (newStatus && ["pagada", "pendiente", "anulada"].includes(newStatus)) {
    boleta.status = newStatus
    localStorage.setItem("boletas", JSON.stringify(boletas.boletas))
    boletas.loadBoletas()
  }
}

function printBoleta() {
  const printContent = document.getElementById("boletaDetails").innerHTML
  const printWindow = window.open("", "_blank")
  printWindow.document.write(`
        <html>
            <head>
                <title>Boleta</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .data-table { width: 100%; border-collapse: collapse; }
                    .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; }
                    .data-table th { background-color: #f2f2f2; }
                    .boleta-total { text-align: right; margin-top: 20px; }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
        </html>
    `)
  printWindow.document.close()
  printWindow.print()
}

function filterBoletas() {
  const searchTerm = document.getElementById("searchBoleta").value.toLowerCase()
  const dateFrom = document.getElementById("dateFrom").value
  const dateTo = document.getElementById("dateTo").value
  const statusFilter = document.getElementById("statusFilterBoleta").value

  const rows = document.querySelectorAll("#boletasTableBody tr")

  rows.forEach((row) => {
    const number = row.cells[0].textContent.toLowerCase()
    const client = row.cells[1].textContent.toLowerCase()
    const date = row.cells[2].textContent
    const status = row.cells[4].textContent.trim()

    const matchesSearch = number.includes(searchTerm) || client.includes(searchTerm)
    const matchesDateFrom = !dateFrom || date >= dateFrom
    const matchesDateTo = !dateTo || date <= dateTo
    const matchesStatus = !statusFilter || status === statusFilter

    row.style.display = matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus ? "" : "none"
  })
}

// Inicializar sistema
let boletas
document.addEventListener("DOMContentLoaded", () => {
  boletas = new BoletasSystem()
})

// Declare auth and modal functions
window.auth = {
  getCurrentUser: () => {
    return { username: "admin" } // Example user
  },
}

window.closeModal = (modalId) => {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.style.display = "none"
  }
}

window.openModal = (modalId) => {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.style.display = "block"
  }
}
