// Sistema de gestión de movimientos
class MovementsSystem {
  constructor() {
    this.movements = JSON.parse(localStorage.getItem("movements")) || []
    this.products = JSON.parse(localStorage.getItem("products")) || []
    this.init()
  }

  init() {
    this.loadMovements()
    this.loadProductsForBatch()
    this.setupEventListeners()
  }

  setupEventListeners() {
    // Los event listeners ya están configurados en el HTML
  }

  loadMovements() {
    const tbody = document.getElementById("movementsTableBody")
    if (!tbody) return

    tbody.innerHTML = ""

    // Ordenar movimientos por fecha (más recientes primero)
    const sortedMovements = [...this.movements].sort((a, b) => new Date(b.date) - new Date(a.date))

    sortedMovements.forEach((movement) => {
      const row = document.createElement("tr")
      const date = new Date(movement.date).toLocaleString("es-ES")

      row.innerHTML = `
                <td>${date}</td>
                <td>${movement.productName}</td>
                <td>${movement.type}</td>
                <td>${movement.quantity}</td>
                <td>${movement.previousStock}</td>
                <td>${movement.newStock}</td>
                <td>${movement.reason}</td>
                <td>${movement.user}</td>
            `
      tbody.appendChild(row)
    })
  }

  loadProductsForBatch() {
    const productSelect = document.getElementById("productSelectBatch")
    if (!productSelect) return

    productSelect.innerHTML = '<option value="">Seleccionar producto</option>'

    this.products.forEach((product) => {
      productSelect.innerHTML += `<option value="${product.id}">${product.name}</option>`
    })
  }

  showLastBatch(productId) {
    if (!productId) {
      document.getElementById("lastBatchInfo").style.display = "none"
      return
    }

    const product = this.products.find((p) => p.id == productId)
    if (!product) return

    // Buscar el último movimiento de entrada para este producto
    const lastEntry = this.movements
      .filter((m) => m.productId == productId && m.type === "entrada")
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]

    if (lastEntry) {
      document.getElementById("lastBatchDate").textContent = new Date(lastEntry.date).toLocaleDateString("es-ES")
      document.getElementById("lastBatchQuantity").textContent = lastEntry.quantity
      document.getElementById("lastBatchSupplier").textContent = product.supplier || "No especificado"
      document.getElementById("lastBatchInfo").style.display = "block"
    } else {
      document.getElementById("lastBatchInfo").style.display = "none"
    }
  }

  exportToExcel() {
    // Crear datos para exportar
    const data = [["Fecha", "Producto", "Tipo", "Cantidad", "Stock Anterior", "Stock Nuevo", "Razón", "Usuario"]]

    this.movements.forEach((movement) => {
      data.push([
        new Date(movement.date).toLocaleString("es-ES"),
        movement.productName,
        movement.type,
        movement.quantity,
        movement.previousStock,
        movement.newStock,
        movement.reason,
        movement.user,
      ])
    })

    // Convertir a CSV
    const csvContent = data.map((row) => row.join(",")).join("\n")

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `historial_movimientos_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Funciones globales
function showLastBatch() {
  const productId = document.getElementById("productSelectBatch").value
  movements.showLastBatch(productId)
}

function exportHistory() {
  movements.exportToExcel()
}

function filterMovements() {
  const searchTerm = document.getElementById("searchMovement").value.toLowerCase()
  const dateFrom = document.getElementById("dateFromMovement").value
  const dateTo = document.getElementById("dateToMovement").value
  const typeFilter = document.getElementById("movementTypeFilter").value
  const reasonFilter = document.getElementById("reasonFilter").value

  const rows = document.querySelectorAll("#movementsTableBody tr")

  rows.forEach((row) => {
    const product = row.cells[1].textContent.toLowerCase()
    const date = row.cells[0].textContent
    const type = row.cells[2].textContent
    const reason = row.cells[6].textContent

    // Convertir fecha para comparación
    const rowDate = new Date(date.split("/").reverse().join("-")).toISOString().split("T")[0]

    const matchesSearch = product.includes(searchTerm)
    const matchesDateFrom = !dateFrom || rowDate >= dateFrom
    const matchesDateTo = !dateTo || rowDate <= dateTo
    const matchesType = !typeFilter || type === typeFilter
    const matchesReason = !reasonFilter || reason === reasonFilter

    row.style.display = matchesSearch && matchesDateFrom && matchesDateTo && matchesType && matchesReason ? "" : "none"
  })
}

// Inicializar sistema
let movements
document.addEventListener("DOMContentLoaded", () => {
  movements = new MovementsSystem()
})
