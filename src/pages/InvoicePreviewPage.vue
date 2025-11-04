<template>
  <q-page class="preview-page">
    <div class="preview-container">
      <!-- Action Bar -->
      <div class="action-bar no-print">
        <q-btn icon="arrow_back" label="Back" flat @click="goBack" />
        <div class="action-right">
          <q-checkbox v-model="showPrice" label="Show Price" dense />
          <q-btn icon="download" round color="primary" @click="downloadImage" class="q-ml-sm" />
        </div>
      </div>

      <!-- Invoice Preview Area -->
      <div id="invoicePreview" class="invoice-preview">
        <!-- Header -->
        <div class="preview-header">
          <div class="shop-info">
            <h2 class="shop-name">{{ invoiceData.shopName || 'Shop Name' }}</h2>
            <div class="invoice-date">Date: {{ invoiceData.date }}</div>
          </div>
        </div>

        <!-- Items List -->
        <div class="items-list">
          <div v-for="(row, i) in invoiceData.rows" :key="row.id" class="item-row">
            <div class="item-left">
              <span class="item-num">{{ i + 1 }}.</span>
              <span class="item-desc">{{ row.description || 'No description' }}</span>
            </div>
            <div class="item-right">
              <span class="item-calc" v-if="showPrice">{{ row.qty }} × {{ formatMoney(row.price) }} = {{
                formatMoney(rowTotal(row)) }}</span>
              <span class="item-qty" v-else>Qty: {{ row.qty }}</span>
            </div>
          </div>

          <!-- Grand Total -->
          <div class="grand-total" v-if="showPrice">
            <div class="total-left">Gross Total:</div>
            <div class="total-right">{{ formatMoney(grossTotal) }}</div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getInvoice } from 'src/utils/db.js'

const router = useRouter()
const route = useRoute()

const showPrice = ref(true)

const invoiceData = ref({
  shopName: '',
  date: '',
  rows: []
})

onMounted(async () => {
  // Check if there's an invoice ID in the route
  if (route.params.id) {
    const invoiceId = parseInt(route.params.id)
    try {
      const invoice = await getInvoice(invoiceId)
      if (invoice) {
        invoiceData.value = {
          shopName: invoice.shopName || '',
          date: invoice.date || '',
          rows: invoice.rows || []
        }
      }
    } catch (error) {
      console.error('Error loading invoice:', error)
    }
  } else if (route.params.data) {
    // Get data from route params
    invoiceData.value = JSON.parse(decodeURIComponent(route.params.data))
  } else {
    // Get data from sessionStorage
    const stored = sessionStorage.getItem('invoicePreviewData')
    if (stored) {
      invoiceData.value = JSON.parse(stored)
    }
  }
})

function goBack() {
  router.push('/')
}

function rowTotal(row) {
  const q = Number(row.qty || 0)
  const p = Number(row.price || 0)
  return q * p
}

const grossTotal = computed(() =>
  invoiceData.value.rows.reduce((sum, r) => sum + rowTotal(r), 0)
)

function formatMoney(n) {
  return Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

async function downloadImage() {
  const area = document.getElementById('invoicePreview')
  if (!area) {
    console.warn('preview area not found')
    return
  }

  const module = await import('html2canvas')
  const html2canvas = module.default || module

  try {
    const canvas = await html2canvas(area, {
      backgroundColor: '#ffffff',
      scale: Math.max(window.devicePixelRatio || 1, 2),
      useCORS: true,
      scrollX: 0,
      scrollY: 0
    })

    const dataUrl = canvas.toDataURL('image/png')
    const safeDate = (invoiceData.value.date || 'invoice').replace(/[^0-9a-zA-Z_-]/g, '-')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `invoice-${safeDate}.png`
    link.click()
  } catch (error) {
    console.error('Error generating image:', error)
  }
}
</script>

<style scoped>
.preview-page {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 1rem;
}

.preview-container {
  max-width: 900px;
  margin: 0 auto;
}

.action-bar {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-right {
  display: flex;
  align-items: center;
}

.invoice-preview {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Header Styles */
.preview-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #333;
}

.shop-name {
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  color: #1976d2;
}

.invoice-date {
  font-size: 1rem;
  color: #666;
}

/* Items List Styles */
.items-list {
  width: 100%;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #e0e0e0;
  gap: 20px;
}

.item-left {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.item-num {
  font-weight: bold;
  flex-shrink: 0;
  font-size: 15px;
  color: #333;
}

.item-desc {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
  font-size: 14px;
  color: #444;
}

.item-right {
  flex-shrink: 0;
  text-align: right;
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  color: #333;
}

.grand-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  padding-top: 25px;
  margin-top: 15px;
  font-weight: bold;
}

.total-left {
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 1.2rem;
  color: #333;
}

.total-right {
  font-size: 1.4rem;
  color: #1976d2;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .invoice-preview {
    padding: 1.5rem;
  }

  .preview-header {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
  }

  .shop-name {
    font-size: 1.5rem;
  }

  .item-row {
    flex-direction: column;
    gap: 8px;
    padding: 10px 0;
  }

  .item-right {
    align-self: flex-end;
  }

  .total-left {
    font-size: 1rem;
  }

  .total-right {
    font-size: 1.2rem;
  }
}

/* Print Styles */
@media print {
  .no-print {
    display: none !important;
  }

  .preview-page {
    background: white;
    padding: 0;
  }

  .preview-container {
    max-width: 100%;
  }

  .invoice-preview {
    box-shadow: none;
    border-radius: 0;
  }
}
</style>
