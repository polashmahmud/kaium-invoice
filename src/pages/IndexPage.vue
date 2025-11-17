<template>
  <q-page class="page-wrapper">
    <div class="container">
      <q-card class="invoice-card">
        <q-card-section id="printArea" class="print-area">
          <InvoiceHeader v-model:shop-name="shopName" v-model:date="date" />

          <InvoiceTable :rows="rows" v-model:commitmentDate="commitmentDate" v-model:commitmentAmount="commitmentAmount"
            @add-row="addRow" @remove-row="removeRow" @print-invoice="printInvoice" @download-image="downloadImage"
            @reset-invoice="resetInvoice" />
        </q-card-section>
      </q-card>
    </div>

    <!-- Activation Modal -->
    <q-dialog v-model="showActivationModal" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Activate Your App</div>
        </q-card-section>

        <q-card-section v-if="!activationStatus.isPermanentlyLocked">
          <div class="q-mb-md text-body1">
            Please enter your activation key to use the app.
          </div>
          <q-input v-model="activationKeyInput" label="Activation Key" type="password" outlined dense
            :error="!!activationError" :error-message="activationError" @keyup.enter="submitActivationKey" />
          <div v-if="activationStatus.attempts > 0 && activationStatus.attempts < 3"
            class="q-mt-sm text-caption text-orange">
            {{ 3 - activationStatus.attempts }} attempt(s) remaining
          </div>
        </q-card-section>

        <q-card-section v-else class="text-center">
          <q-icon name="lock" size="64px" color="negative" class="q-mb-md" />
          <div class="text-h6 text-negative q-mb-md">
            Your app is permanently locked
          </div>
          <div class="text-body2 text-grey-7">
            You have exceeded the maximum number of activation attempts.
          </div>
        </q-card-section>

        <q-card-actions align="right" v-if="!activationStatus.isPermanentlyLocked">
          <q-btn flat label="Submit" color="primary" @click="submitActivationKey" :disable="!activationKeyInput" />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
  setCurrentInvoiceId,
  getActivationStatus,
  verifyActivationKey
} from 'src/utils/db.js'

const router = useRouter()

const shopName = ref('')
const date = ref(new Date().toISOString().slice(0, 10))
const commitmentDate = ref('')
const commitmentAmount = ref(0)
const currentInvoiceId = ref(null)
const isLoading = ref(true)

// Activation state
const showActivationModal = ref(false)
const activationKeyInput = ref('')
const activationError = ref('')
const activationStatus = ref({
  isActivated: false,
  attempts: 0,
  isPermanentlyLocked: false
})

let counter = 1
const rows = ref([
  { id: 1, description: '', qty: 0, price: 0 },
])

// Initialize and load invoice on mount
onMounted(async () => {
  try {
    await initDB()

    // Check activation status first
    const status = await getActivationStatus()
    activationStatus.value = status

    if (!status.isActivated) {
      // Show activation modal
      showActivationModal.value = true
      isLoading.value = false
      return
    }

    // If activated, proceed with loading invoice
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
watch([shopName, date, rows, commitmentDate, commitmentAmount], async () => {
  if (!isLoading.value && currentInvoiceId.value) {
    await saveCurrentInvoice()
  }
}, { deep: true })

// Load invoice data
function loadInvoiceData(invoice) {
  shopName.value = invoice.shopName || ''
  date.value = invoice.date || new Date().toISOString().slice(0, 10)
  rows.value = invoice.rows || [{ id: 1, description: '', qty: 0, price: 0 }]
  commitmentDate.value = invoice.commitmentDate || ''
  commitmentAmount.value = invoice.commitmentAmount || 0

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
    rows: [{ id: 1, description: '', qty: 0, price: 0 }],
    commitmentDate: '',
    commitmentAmount: 0
  }

  const id = await createInvoice(invoiceData)
  currentInvoiceId.value = id
  setCurrentInvoiceId(id)

  shopName.value = ''
  date.value = invoiceData.date
  rows.value = [...invoiceData.rows]
  commitmentDate.value = ''
  commitmentAmount.value = 0
  counter = 1
}

// Save current invoice
async function saveCurrentInvoice() {
  if (!currentInvoiceId.value) return

  try {
    const invoiceData = {
      shopName: shopName.value,
      date: date.value,
      rows: rows.value,
      commitmentDate: commitmentDate.value,
      commitmentAmount: commitmentAmount.value
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
    rows: rows.value,
    commitmentDate: commitmentDate.value,
    commitmentAmount: commitmentAmount.value
  }
  sessionStorage.setItem('invoicePreviewData', JSON.stringify(invoiceData))

  // Navigate to preview page
  router.push('/preview')
}

// Activation functions
async function submitActivationKey() {
  if (!activationKeyInput.value) {
    activationError.value = 'Please enter activation key'
    return
  }

  try {
    const result = await verifyActivationKey(activationKeyInput.value)

    if (result.success) {
      // Activation successful
      activationStatus.value.isActivated = true
      showActivationModal.value = false
      activationError.value = ''

      // Load invoice data
      await loadInvoiceOnActivation()
    } else {
      // Activation failed
      activationStatus.value = {
        isActivated: false,
        attempts: result.attempts || 0,
        isPermanentlyLocked: result.isPermanentlyLocked || false
      }

      if (result.isPermanentlyLocked) {
        activationKeyInput.value = ''
        activationError.value = ''
      } else {
        activationError.value = result.message
        activationKeyInput.value = ''
      }
    }
  } catch (error) {
    console.error('Activation error:', error)
    activationError.value = 'An error occurred. Please try again.'
  }
}

async function loadInvoiceOnActivation() {
  try {
    const savedId = getCurrentInvoiceId()

    if (savedId) {
      const invoice = await getInvoice(savedId)
      if (invoice) {
        loadInvoiceData(invoice)
        currentInvoiceId.value = savedId
      } else {
        await createNewInvoice()
      }
    } else {
      await createNewInvoice()
    }
  } catch (error) {
    console.error('Error loading invoice:', error)
  } finally {
    isLoading.value = false
  }
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
