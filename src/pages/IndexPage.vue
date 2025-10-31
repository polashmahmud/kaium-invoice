<template>
  <q-page padding class="bg-grey-2">
    <div id="printArea" class="q-pa-md" style="max-width: 900px; margin: auto">

      <q-card bordered flat class="q-pa-lg bg-white">

        <!-- Shop & Date -->
        <div class="q-mb-md">
          <q-input filled v-model="shopName" label="Shop Name" dense class="q-mb-sm" />
          <q-input filled v-model="date" label="Date" dense type="date" />
        </div>

        <!-- Items Table -->
        <q-table flat bordered :rows="rows" :columns="filteredColumns" row-key="sl" hide-bottom class="text-body1">
          <template #body-cell-actions="props">
            <q-td v-if="!hideActions">
              <q-btn dense flat round icon="delete" color="red" @click="removeRow(props.row.sl)">
                <q-tooltip>Delete Item</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>

        <!-- Total -->
        <div class="row justify-end q-mt-md text-h6 text-bold">
          Grand Total: {{ grandTotal }}
        </div>

        <!-- Buttons -->
        <div class="row justify-between q-mt-xl no-print">
          <q-btn round dense flat icon="add" color="primary" @click="drawer = true">
            <q-tooltip>Add Product</q-tooltip>
          </q-btn>

          <div class="row items-center">
            <q-btn round dense flat icon="arrow_back" color="orange" class="q-mr-sm" @click="loadPrevious">
              <q-tooltip>Previous Invoice</q-tooltip>
            </q-btn>

            <q-btn round dense flat icon="save" color="blue" class="q-mr-sm" @click="saveInvoice">
              <q-tooltip>Save Invoice</q-tooltip>
            </q-btn>

            <q-btn round dense flat icon="print" color="green" class="q-mr-sm" @click="handlePrint">
              <q-tooltip>Print Invoice</q-tooltip>
            </q-btn>

            <q-btn round dense flat icon="arrow_forward" color="purple" @click="nextInvoice">
              <q-tooltip>Next Invoice</q-tooltip>
            </q-btn>
          </div>
        </div>

      </q-card>
    </div>

    <!-- Drawer bottom -->
    <q-dialog v-model="drawer" position="bottom">
      <q-card class="full-width q-pa-md" style="border-radius: 16px 16px 0 0;">
        <div class="text-h6 text-bold q-mb-md">Add Product</div>

        <q-input filled v-model="dDescription" label="Description" dense class="q-mb-sm" />
        <q-input filled type="number" v-model.number="dQty" label="Qty" dense class="q-mb-sm" />
        <q-input filled type="number" v-model.number="dPrice" label="Price" dense class="q-mb-sm" />

        <div class="row justify-end q-mt-md">
          <q-btn flat label="Cancel" color="grey" @click="drawer = false" class="q-mr-sm" />
          <q-btn label="Submit" color="primary" @click="submitNewProduct" />
        </div>
      </q-card>
    </q-dialog>

    <p class="text-center">
      Developed by <a href="https://polashmahmud.com" target="_blank">Polash Mahmud</a>. </p>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { useQuasar } from 'quasar'
import Localbase from 'localbase'
let db = new Localbase('invoiceDB')

const $q = useQuasar()
// Suppress Localbase missing-document console errors
if (db && db.config) {
  db.config.debug = false
}

// UI STATE
const drawer = ref(false)
const hideActions = ref(false)

// Fields
const shopName = ref("")
const date = ref(new Date().toISOString().substring(0, 10))
const rows = ref([])
const dDescription = ref("")
const dQty = ref(0)
const dPrice = ref(0)

// History
const invoices = ref([])
const pointer = ref(0)

// Table Columns
const columns = [
  { label: 'Sl', field: 'sl', align: 'center' },
  { label: 'Description', field: 'description' },
  { label: 'Qty', field: 'qty', align: 'center' },
  { label: 'Price', field: 'price', align: 'center' },
  { label: 'Total', field: 'total', align: 'center' },
  { label: 'Action', name: 'actions', align: 'center' },
]

// Dynamically remove Action for print
const filteredColumns = computed(() =>
  hideActions.value
    ? columns.filter(c => c.name !== 'actions')
    : columns
)

// Add row
const submitNewProduct = () => {
  rows.value.push({
    sl: rows.value.length + 1,
    description: dDescription.value,
    qty: dQty.value,
    price: dPrice.value,
    total: dQty.value * dPrice.value
  })

  dDescription.value = ""
  dQty.value = 0
  dPrice.value = 0
  drawer.value = false
}

// Remove row
const removeRow = sl => {
  rows.value = rows.value.filter(r => r.sl !== sl)
  rows.value.forEach((r, i) => (r.sl = i + 1))
}

// Total
const grandTotal = computed(() =>
  rows.value.reduce((sum, r) => sum + r.total, 0)
)

// Save invoice
const saveInvoice = async () => {
  if (!rows.value.length) {
    $q.notify({
      type: 'warning',
      message: 'Add at least 1 product!',
      position: 'top'
    })
    return
  }

  invoices.value[pointer.value] = {
    shopName: shopName.value,
    date: date.value,
    items: JSON.parse(JSON.stringify(rows.value)),
    grandTotal: grandTotal.value,
    updated_at: new Date().toISOString()
  }

  try {
    // Save as object with 'data' key containing the array
    const dataToSave = JSON.parse(JSON.stringify(invoices.value))
    await db.collection('invoicesList').doc('data').set({ data: dataToSave })
    await db.collection('pointer').doc('p').set({ current: Number(pointer.value) })

    $q.notify({
      type: 'positive',
      message: '✅ Invoice Saved!',
      position: 'top'
    })
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to save invoice',
      position: 'top'
    })
  }
}

// Load invoices without triggering missing-doc errors
const loadFromDB = async () => {
  try {
    // Get entire collections; this does not error if empty
    const invoicesDocs = await db.collection('invoicesList').get().catch(() => [])
    const pointerDocs = await db.collection('pointer').get().catch(() => [])

    const invoicesDoc = Array.isArray(invoicesDocs) ? invoicesDocs[0] : null
    invoices.value = invoicesDoc?.data || []

    const pointerDoc = Array.isArray(pointerDocs) ? pointerDocs[0] : null
    pointer.value = pointerDoc?.current || 0

    if (!invoices.value.length) {
      invoices.value = [{}]
      pointer.value = 0
    }

    loadInvoice(pointer.value)
  } catch {
    // If no data exists yet, initialize with empty array
    invoices.value = [{}]
    pointer.value = 0
    loadInvoice(0)
  }
}

const loadInvoice = i => {
  const inv = invoices.value[i] || {}
  shopName.value = inv.shopName || ""
  date.value = inv.date || new Date().toISOString().substring(0, 10)
  rows.value = inv.items || []
}

const nextInvoice = () => {
  pointer.value++
  invoices.value[pointer.value] = {}
  rows.value = []
  shopName.value = ""
}

const loadPrevious = () => {
  if (pointer.value > 0) {
    pointer.value--
    loadInvoice(pointer.value)
  }
}

// Print safely
const handlePrint = () => {
  hideActions.value = true
  setTimeout(() => {
    window.print()
    setTimeout(() => (hideActions.value = false), 200)
  }, 50)
}

onMounted(loadFromDB)
</script>

<style scoped>
@media print {

  .no-print,
  .q-btn {
    display: none !important;
  }
}

.q-table thead tr th {
  background: #f5f5f5;
  font-weight: bold;
}
</style>
