<template>
  <q-page class="page-wrapper">
    <div class="container">
      <q-card class="invoice-card">
        <q-card-section id="printArea" class="print-area">
          <InvoiceHeader v-model:shop-name="shopName" v-model:date="date" />

          <InvoiceTable :rows="rows" @add-row="addRow" @remove-row="removeRow" />
        </q-card-section>
      </q-card>
    </div>
    <q-btn class="print-fab no-print" fab color="primary" icon="print" aria-label="Print invoice"
      @click="printInvoice" />
    <q-btn class="image-fab no-print" fab color="secondary" icon="image" aria-label="Export invoice snapshot"
      @click="downloadImage" />
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import InvoiceHeader from 'components/InvoiceHeader.vue'
import InvoiceTable from 'components/InvoiceTable.vue'

const shopName = ref('')
const date = ref(new Date().toISOString().slice(0, 10))

let counter = 3
const rows = ref([
  { id: 1, description: '', qty: 1, price: 0 },
])

function addRow() {
  rows.value.push({ id: ++counter, description: '', qty: 1, price: 0 })
}

function removeRow(index) {
  rows.value.splice(index, 1)
  if (rows.value.length === 0) addRow()
}

function printInvoice() {
  window.print()
}
async function downloadImage() {
  const area = document.getElementById('printArea')
  if (!area) {
    console.warn('print area not found')
    return
  }

  const module = await import('html2canvas')
  const html2canvas = module.default || module

  const container = area.closest('.container')
  const card = area.closest('.invoice-card')
  if (container) container.classList.add('exporting')
  if (card) card.classList.add('exporting')
  area.classList.add('exporting')
  let canvas
  try {
    const width = Math.max(area.scrollWidth, area.clientWidth)
    const height = Math.max(area.scrollHeight, area.clientHeight)
    canvas = await html2canvas(area, {
      backgroundColor: '#ffffff',
      scale: Math.max(window.devicePixelRatio || 1, 2),
      useCORS: true,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY
    })
  } finally {
    area.classList.remove('exporting')
    if (card) card.classList.remove('exporting')
    if (container) container.classList.remove('exporting')
  }

  if (!canvas) return

  const dataUrl = canvas.toDataURL('image/png')
  const safeDate = (date.value || 'invoice').replace(/[^0-9a-zA-Z_-]/g, '-')
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `invoice-${safeDate}.png`
  link.click()
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

.print-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
}

.image-fab {
  position: fixed;
  bottom: 24px;
  right: 96px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .page-wrapper {
    padding: 1rem 0.5rem;
  }

  .print-area {
    padding: 1rem !important;
  }

  .print-fab {
    bottom: 16px;
    right: 16px;
  }

  .image-fab {
    bottom: 16px;
    right: 84px;
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
