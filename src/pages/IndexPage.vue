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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import InvoiceHeader from 'components/InvoiceHeader.vue'
import InvoiceTable from 'components/InvoiceTable.vue'

const router = useRouter()

const shopName = ref('')
const date = ref(new Date().toISOString().slice(0, 10))

let counter = 3
const rows = ref([
  { id: 1, description: '', qty: 0, price: 0 },
])

function addRow() {
  rows.value.push({ id: ++counter, description: '', qty: 1, price: 0 })
}

function removeRow(index) {
  rows.value.splice(index, 1)
  if (rows.value.length === 0) addRow()
}

function resetInvoice() {
  shopName.value = ''
  date.value = new Date().toISOString().slice(0, 10)
  counter = 1
  rows.value = [{ id: 1, description: '', qty: 1, price: 0 }]
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
