<template>
  <q-page class="page-wrapper">
    <div class="container">
      <q-card class="invoice-card">
        <q-card-section id="printArea" class="print-area">
          <InvoiceHeader v-model:shop-name="shopName" v-model:date="date" />

          <InvoiceTable :rows="rows" @add-row="addRow" @remove-row="removeRow" @print-invoice="printInvoice"
            @download-image="downloadImage" @reset-invoice="resetInvoice" />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import InvoiceHeader from 'components/InvoiceHeader.vue'
import InvoiceTable from 'components/InvoiceTable.vue'
import {
  initDB,
  createInvoice,
  getInvoice,
  updateInvoice,
  getCurrentInvoiceId,
  setCurrentInvoiceId
} from 'src/utils/db.js'

const router = useRouter()

const shopName = ref('')
const date = ref(new Date().toISOString().slice(0, 10))
const currentInvoiceId = ref(null)
const isLoading = ref(true)

let counter = 1
const rows = ref([
  { id: 1, description: '', qty: 0, price: 0 },
])

// Initialize and load invoice on mount
onMounted(async () => {
  try {
    await initDB()

    // Check if there's a current invoice ID
    const savedId = getCurrentInvoiceId()

    if (savedId) {
      // Load existing invoice
      const invoice = await getInvoice(savedId)
      if (invoice) {
        loadInvoiceData(invoice)
        currentInvoiceId.value = savedId
      } else {
        // Invoice not found, create new one
        await createNewInvoice()
      }
    } else {
      // No current invoice, create new one
      await createNewInvoice()
    }
  } catch (error) {
    console.error('Error initializing invoice:', error)
    // If error, still allow user to work
  } finally {
    isLoading.value = false
  }
})

// Watch for changes and auto-save
watch([shopName, date, rows], async () => {
  if (!isLoading.value && currentInvoiceId.value) {
    await saveCurrentInvoice()
  }
}, { deep: true })

// Load invoice data
function loadInvoiceData(invoice) {
  shopName.value = invoice.shopName || ''
  date.value = invoice.date || new Date().toISOString().slice(0, 10)
  rows.value = invoice.rows || [{ id: 1, description: '', qty: 0, price: 0 }]

  // Update counter to highest ID
  if (rows.value.length > 0) {
    counter = Math.max(...rows.value.map(r => r.id))
  }
}

// Create new invoice
async function createNewInvoice() {
  const invoiceData = {
    shopName: '',
    date: new Date().toISOString().slice(0, 10),
    rows: [{ id: 1, description: '', qty: 0, price: 0 }]
  }

  const id = await createInvoice(invoiceData)
  currentInvoiceId.value = id
  setCurrentInvoiceId(id)

  shopName.value = ''
  date.value = invoiceData.date
  rows.value = [...invoiceData.rows]
  counter = 1
}

// Save current invoice
async function saveCurrentInvoice() {
  if (!currentInvoiceId.value) return

  try {
    const invoiceData = {
      shopName: shopName.value,
      date: date.value,
      rows: rows.value
    }

    await updateInvoice(currentInvoiceId.value, invoiceData)
  } catch (error) {
    console.error('Error saving invoice:', error)
  }
}

function addRow() {
  rows.value.push({ id: ++counter, description: '', qty: 0, unit: 'Pcs', price: 0 })
}

function removeRow(index) {
  rows.value.splice(index, 1)
  if (rows.value.length === 0) addRow()
}

async function resetInvoice() {
  // Save current invoice before creating new one
  if (currentInvoiceId.value) {
    await saveCurrentInvoice()
  }

  // Create new invoice
  await createNewInvoice()
}

function printInvoice() {
  window.print()
}

function downloadImage() {
  // Save invoice data to sessionStorage
  const invoiceData = {
    shopName: shopName.value,
    date: date.value,
    rows: rows.value
  }
  sessionStorage.setItem('invoicePreviewData', JSON.stringify(invoiceData))

  // Navigate to preview page
  router.push('/preview')
}
</script>

<style scoped>
.page-wrapper {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 2rem 1rem;
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

.container.exporting {
  max-width: none;
  width: max-content;
}

.invoice-card {
  border-radius: 8px;
  background: white;
}

.invoice-card.exporting {
  width: max-content;
}

.print-area {
  padding: 2rem !important;
}

#printArea.exporting {
  width: max-content;
  min-width: 100%;
  display: inline-block;
}

#printArea.exporting :deep(.table-wrapper) {
  overflow: visible;
}

#printArea.exporting :deep(.no-print) {
  display: none !important;
}

@media (max-width: 768px) {
  .page-wrapper {
    padding: 1rem 0.5rem;
  }

  .print-area {
    padding: 1rem !important;
  }
}

@media print {
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body,
  .q-page,
  .page-wrapper {
    background: #fff !important;
    margin: 0;
    padding: 0;
  }

  .no-print,
  .no-print * {
    display: none !important;
  }

  .invoice-card {
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
  }

  .container {
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  .print-area {
    padding: 15mm 10mm !important;
  }

  .print-fab {
    display: none !important;
  }

  .image-fab {
    display: none !important;
  }
}
</style>
