// Sistema de gestión de inventario
class InventorySystem {
  constructor() {
    this.products = JSON.parse(localStorage.getItem("products")) || []
    this.movements = JSON.parse(localStorage.getItem("movements")) || []
    this.nextProductId = Number.parseInt(localStorage.getItem("nextProductId")) || 1
    this.auth = { getCurrentUser: () => ({ username: "defaultUser" }) } // Placeholder for auth variable
    this.init()
  }

  init() {
    this.loadProducts()
    this.checkStockAlerts()
    this.setupEventListeners()
  }

  setupEventListeners() {
    // Formulario de producto
    const productForm = document.getElementById("productForm")
    if (productForm) {
      productForm.addEventListener("submit", (e) => {
        e.preventDefault()
        this.saveProduct()
      })
    }

    // Formulario de actualización de stock
    const stockForm = document.getElementById("stockForm")
    if (stockForm) {
      stockForm.addEventListener("submit", (e) => {
        e.preventDefault()
        this.updateStock()
      })
    }
  }

  saveProduct() {
    const productData = {
      id: document.getElementById("productId").value || this.nextProductId++,
      code: document.getElementById("productCode").value,
      name: document.getElementById("productName").value,
      category: document.getElementById("productCategory").value,
      price: Number.parseFloat(document.getElementById("productPrice").value),
      stock: Number.parseInt(document.getElementById("productStock").value),
      minStock: Number.parseInt(document.getElementById("productMinStock").value),
      supplier: document.getElementById("productSupplier").value,
      status: "disponible",
      entryDate: new Date().toISOString().split("T")[0],
    }

    // Validaciones
    if (!this.validateProduct(productData)) {
      return
    }

    const existingIndex = this.products.findIndex((p) => p.id == productData.id)

    if (existingIndex >= 0) {
      // Actualizar producto existente
      const oldStock = this.products[existingIndex].stock
      this.products[existingIndex] = productData

      // Registrar movimiento si cambió el stock
      if (oldStock !== productData.stock) {
        this.addMovement({
          productId: productData.id,
          productName: productData.name,
          type: productData.stock > oldStock ? "entrada" : "salida",
          quantity: Math.abs(productData.stock - oldStock),
          previousStock: oldStock,
          newStock: productData.stock,
          reason: "ajuste",
          date: new Date().toISOString(),
          user: this.auth.getCurrentUser().username,
        })
      }
    } else {
      // Nuevo producto
      this.products.push(productData)

      // Registrar movimiento de entrada inicial
      this.addMovement({
        productId: productData.id,
        productName: productData.name,
        type: "entrada",
        quantity: productData.stock,
        previousStock: 0,
        newStock: productData.stock,
        reason: "compra",
        date: new Date().toISOString(),
        user: this.auth.getCurrentUser().username,
      })
    }

    this.saveToStorage()
    this.loadProducts()
    this.checkStockAlerts()
    closeModal("productModal")
    this.resetProductForm()

    alert("Producto guardado exitosamente")
  }

  validateProduct(product) {
    if (
      !product.code ||
      !product.name ||
      !product.category ||
      product.price < 0 ||
      product.stock < 0 ||
      product.minStock < 0
    ) {
      alert("Por favor, complete todos los campos correctamente")
      return false
    }

    // Verificar código único (excepto para edición)
    const existingProduct = this.products.find((p) => p.code === product.code && p.id != product.id)
    if (existingProduct) {
      alert("Ya existe un producto con este código")
      return false
    }

    return true
  }

  updateStock() {
    const productId = document.getElementById("stockProductId").value
    const newQuantity = Number.parseInt(document.getElementById("stockQuantity").value)
    const reason = document.getElementById("stockReason").value

    const product = this.products.find((p) => p.id == productId)
    if (!product) {
      alert("Producto no encontrado")
      return
    }

    const previousStock = product.stock
    product.stock = newQuantity
    product.lastUpdate = new Date().toISOString().split("T")[0]

    // Marcar como dañado o vencido si es necesario
    if (reason === "dañado" || reason === "vencido") {
      product.status = reason
    }

    // Registrar movimiento
    this.addMovement({
      productId: product.id,
      productName: product.name,
      type: newQuantity > previousStock ? "entrada" : "salida",
      quantity: Math.abs(newQuantity - previousStock),
      previousStock: previousStock,
      newStock: newQuantity,
      reason: reason,
      date: new Date().toISOString(),
      user: this.auth.getCurrentUser().username,
    })

    this.saveToStorage()
    this.loadProducts()
    this.checkStockAlerts()
    closeModal("stockModal")

    alert("Stock actualizado exitosamente")
  }

  addMovement(movement) {
    this.movements.push(movement)
    localStorage.setItem("movements", JSON.stringify(this.movements))
  }

  loadProducts() {
    const tbody = document.getElementById("productsTableBody")
    if (!tbody) return

    tbody.innerHTML = ""

    this.products.forEach((product) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${product.code}</td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.stock}</td>
                <td>${product.minStock}</td>
                <td>S/.${product.price.toFixed(2)}</td>
                <td><span class="status-${product.status}">${product.status}</span></td>
                <td>${product.supplier}</td>
                <td>${product.entryDate}</td>
                <td>
                    <button class="btn btn-warning" onclick="editProduct(${product.id})">Editar</button>
                    <button class="btn btn-secondary" onclick="openStockModal(${product.id})">Stock</button>
                    <button class="btn btn-danger" onclick="markAsDamaged(${product.id})">Dañado</button>
                    <button class="btn btn-danger" onclick="deleteProduct(${product.id})">Eliminar</button>
                </td>
            `
      tbody.appendChild(row)
    })

    this.loadDamagedProducts()
  }

  loadDamagedProducts() {
    const container = document.getElementById("damagedProductsList")
    if (!container) return

    const damagedProducts = this.products.filter((p) => p.status === "dañado" || p.status === "vencido")

    container.innerHTML = ""

    damagedProducts.forEach((product) => {
      const item = document.createElement("div")
      item.className = "damaged-item"
      item.innerHTML = `
                <h4>${product.name}</h4>
                <p><strong>Código:</strong> ${product.code}</p>
                <p><strong>Estado:</strong> ${product.status}</p>
                <p><strong>Cantidad:</strong> ${product.stock}</p>
                <button class="btn btn-secondary" onclick="restoreProduct(${product.id})">Restaurar</button>
            `
      container.appendChild(item)
    })
  }

  checkStockAlerts() {
    const alertsContainer = document.getElementById("stockAlerts")
    const alertsList = document.getElementById("alertsList")

    if (!alertsContainer || !alertsList) return

    const lowStockProducts = this.products.filter((p) => p.stock <= p.minStock && p.status === "disponible")

    if (lowStockProducts.length > 0) {
      alertsContainer.style.display = "block"
      alertsList.innerHTML = ""

      lowStockProducts.forEach((product) => {
        const alert = document.createElement("div")
        alert.className = "alert-item"
        alert.innerHTML = `
                    <strong>${product.name}</strong> - Stock actual: ${product.stock}, Mínimo: ${product.minStock}
                `
        alertsList.appendChild(alert)
      })
    } else {
      alertsContainer.style.display = "none"
    }
  }

  saveToStorage() {
    localStorage.setItem("products", JSON.stringify(this.products))
    localStorage.setItem("nextProductId", this.nextProductId.toString())
  }

  resetProductForm() {
    document.getElementById("productForm").reset()
    document.getElementById("productId").value = ""
    document.getElementById("modalTitle").textContent = "Agregar Producto"
  }
}

// Funciones globales
function openModal(modalId) {
  document.getElementById(modalId).style.display = "block"
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none"
}

function editProduct(id) {
  const product = inventory.products.find((p) => p.id == id)
  if (!product) return

  document.getElementById("productId").value = product.id
  document.getElementById("productCode").value = product.code
  document.getElementById("productName").value = product.name
  document.getElementById("productCategory").value = product.category
  document.getElementById("productPrice").value = product.price
  document.getElementById("productStock").value = product.stock
  document.getElementById("productMinStock").value = product.minStock
  document.getElementById("productSupplier").value = product.supplier
  document.getElementById("modalTitle").textContent = "Editar Producto"

  openModal("productModal")
}

function openStockModal(id) {
  document.getElementById("stockProductId").value = id
  document.getElementById("stockQuantity").value = ""
  document.getElementById("stockReason").value = ""
  openModal("stockModal")
}

function markAsDamaged(id) {
  if (confirm("¿Está seguro de marcar este producto como dañado?")) {
    const product = inventory.products.find((p) => p.id == id)
    if (product) {
      product.status = "dañado"
      inventory.saveToStorage()
      inventory.loadProducts()
    }
  }
}

function restoreProduct(id) {
  if (confirm("¿Está seguro de restaurar este producto?")) {
    const product = inventory.products.find((p) => p.id == id)
    if (product) {
      product.status = "disponible"
      inventory.saveToStorage()
      inventory.loadProducts()
    }
  }
}

function deleteProduct(id) {
  if (confirm("¿Está seguro de eliminar este producto?")) {
    inventory.products = inventory.products.filter((p) => p.id != id)
    inventory.saveToStorage()
    inventory.loadProducts()
  }
}

function filterProducts() {
  const searchTerm = document.getElementById("searchProduct").value.toLowerCase()
  const categoryFilter = document.getElementById("categoryFilter").value
  const statusFilter = document.getElementById("statusFilter").value

  const rows = document.querySelectorAll("#productsTableBody tr")

  rows.forEach((row) => {
    const name = row.cells[1].textContent.toLowerCase()
    const category = row.cells[2].textContent
    const status = row.cells[6].textContent.trim()

    const matchesSearch = name.includes(searchTerm)
    const matchesCategory = !categoryFilter || category === categoryFilter
    const matchesStatus = !statusFilter || status === statusFilter

    row.style.display = matchesSearch && matchesCategory && matchesStatus ? "" : "none"
  })
}

// Inicializar sistema
let inventory
document.addEventListener("DOMContentLoaded", () => {
  inventory = new InventorySystem()
})
