<template>
  <div class="table-section">
    <!-- Desktop Table View -->
    <div class="table-wrapper desktop-only">
      <table class="inv-table">
        <thead>
          <tr>
            <th style="width: 50px;">#</th>
            <th>Description</th>
            <th style="width: 90px;">Qty</th>
            <th style="width: 100px;">Unit</th>
            <th style="width: 110px;">Price</th>
            <th style="width: 110px;">Total</th>
            <th class="no-print" style="width: 60px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="row.id">
            <td class="text-center">{{ i + 1 }}</td>
            <td class="description-cell">
              <div class="description-editor">
                <q-input v-model="row.description" type="textarea" autogrow dense borderless
                  input-class="description-input" />
              </div>
              <div class="description-display">
                <span v-if="row.description">{{ row.description }}</span>
                <span v-else>&nbsp;</span>
              </div>
            </td>
            <td class="qty-cell">
              <q-input v-model.number="row.qty" type="number" min="0" step="1" dense borderless class="text-center"
                @update:model-value="normalizeQty(row)" />
            </td>
            <td class="unit-cell">
              <q-select v-model="row.unit" :options="unitOptions" dense borderless options-dense />
            </td>
            <td class="price-cell">
              <q-input v-model.number="row.price" type="number" min="0" step="0.01" dense borderless class="text-right"
                @keydown.enter="(e) => handlePriceEnter(i, e)" />
            </td>
            <td class="text-right">{{ formatMoney(rowTotal(row)) }}</td>
            <td class="no-print text-center">
              <q-btn flat round dense icon="delete" size="sm" @click="$emit('remove-row', i)" />
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="total-row-table">
            <td colspan="5" class="text-right total-label-cell">
              <strong>Gross Total:</strong>
            </td>
            <td class="text-right total-amount-cell">
              <strong>{{ formatMoney(grossTotal) }}</strong>
            </td>
            <td class="no-print"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Mobile List View -->
    <div class="mobile-only">
      <div ref="mobileListContainer" class="mobile-list-container">
        <q-list bordered separator class="invoice-list">
          <q-item v-for="(row, i) in rows" :key="row.id" class="invoice-item">
            <q-item-section>
              <q-item-label class="item-number">
                <strong>Item #{{ i + 1 }}</strong>
              </q-item-label>

              <q-item-label caption class="q-mt-sm">
                <strong>Description:</strong>
              </q-item-label>
              <div class="description-field">
                <div class="description-editor">
                  <q-input v-model="row.description" type="textarea" autogrow dense outlined
                    placeholder="Enter description" />
                </div>
                <div class="description-display">
                  <span v-if="row.description">{{ row.description }}</span>
                  <span v-else class="text-grey-6">No description</span>
                </div>
              </div>

              <div class="row q-col-gutter-sm q-mt-xs">
                <div class="col-4">
                  <q-item-label caption><strong>Quantity:</strong></q-item-label>
                  <q-input v-model.number="row.qty" type="number" min="0" step="1" dense outlined
                    @update:model-value="normalizeQty(row)" />
                </div>
                <div class="col-4">
                  <q-item-label caption><strong>Unit:</strong></q-item-label>
                  <q-select v-model="row.unit" :options="unitOptions" dense outlined options-dense />
                </div>
                <div class="col-4">
                  <q-item-label caption><strong>Price:</strong></q-item-label>
                  <q-input v-model.number="row.price" type="number" min="0" step="0.01" dense outlined
                    @keydown.enter="(e) => handlePriceEnter(i, e)" />
                </div>
              </div>

              <q-item-label class="q-mt-sm">
                <strong>Total: {{ formatMoney(rowTotal(row)) }}</strong>
              </q-item-label>

              <div class="no-print q-mt-sm">
                <q-btn flat dense color="negative" icon="delete" label="Remove" size="sm"
                  @click="$emit('remove-row', i)" />
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Mobile Total -->
        <div class="mobile-total q-pa-md">
          <div class="text-h6 text-right">
            <strong>Gross Total: {{ formatMoney(grossTotal) }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Print View (List-based layout) -->
    <div class="print-only">
      <div class="print-invoice-list">
        <!-- Items -->
        <div v-for="(row, i) in rows" :key="row.id" class="print-item">
          <div class="print-item-left">
            <span class="print-item-num">{{ i + 1 }}.</span>
            <span class="print-item-desc">{{ row.description || 'No description' }}</span>
          </div>
          <div class="print-item-right">
            <span class="print-calculation">{{ row.qty }} {{ row.unit || 'Pcs' }} × {{ formatMoney(row.price) }} = {{
              formatMoney(rowTotal(row))
            }}</span>
          </div>
        </div>

        <!-- Total -->
        <div class="print-grand-total">
          <div class="print-total-left">Gross Total:</div>
          <div class="print-total-right">{{ formatMoney(grossTotal) }}</div>
        </div>
      </div>
    </div>

    <!-- Add Row Button -->
    <div class="no-print q-mt-md">
      <q-btn-group spread rounded>
        <q-btn icon="add" @click="$emit('add-row')" />
        <q-btn icon="print" @click="$emit('print-invoice')" />
        <q-btn icon="image" @click="$emit('download-image')" />
        <q-btn icon="refresh" @click="$emit('reset-invoice')" />
      </q-btn-group>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'

const props = defineProps({
  rows: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['add-row', 'remove-row', 'print-invoice', 'download-image', 'reset-invoice'])

// Unit options
const unitOptions = [
  'Pcs',
  'Box',
  'Carton',
  'Dozen',
  'Kg',
  'Gram',
  'Liter',
  'Meter',
  'Set',
  'Pair',
  'Pack',
  'Unit'
]

const mobileListContainer = ref(null)

// Handle Enter key on price field
function handlePriceEnter(index, event) {
  // Check if this is the last row
  if (index === props.rows.length - 1) {
    // Prevent default behavior to stop Enter from being added to description
    event.preventDefault()
    event.stopPropagation()

    // Add new row
    emit('add-row')
  }
}

// Watch for new rows and scroll to the last item + focus on description
watch(() => props.rows.length, async (newLength, oldLength) => {
  if (newLength > oldLength) {
    await nextTick()

    // Try to find and focus the description input for the last item
    const descriptionInputs = document.querySelectorAll('.description-editor textarea')
    if (descriptionInputs.length > 0) {
      const lastInput = descriptionInputs[descriptionInputs.length - 1]

      // Focus first
      lastInput?.focus()

      // Then scroll after a short delay to ensure proper positioning
      await nextTick()
      setTimeout(() => {
        if (mobileListContainer.value) {
          const container = mobileListContainer.value
          // Scroll to bottom smoothly
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          })
        }

        // Scroll the input into view if needed
        lastInput?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        })
      }, 100)
    }
  }
})

function normalizeQty(row) {
  if (row.qty < 0) row.qty = 0
  row.qty = Math.floor(row.qty || 0)
}

function rowTotal(row) {
  const q = Number(row.qty || 0)
  const p = Number(row.price || 0)
  return q * p
}

const grossTotal = computed(() =>
  props.rows.reduce((sum, r) => sum + rowTotal(r), 0)
)

function formatMoney(n) {
  return Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
</script>

<style scoped>
.table-section {
  margin-top: 1.5rem;
}

/* Desktop/Tablet: Show table, hide list */
.mobile-only {
  display: none;
}

.desktop-only {
  display: block;
}

.print-only {
  display: none;
}

.table-wrapper {
  overflow-x: auto;
  margin-bottom: 0.75rem;
}

.inv-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  border: 1px solid #000;
}

.inv-table th,
.inv-table td {
  border: 1px solid #000;
  padding: 6px 8px;
  vertical-align: top;
}

.inv-table thead th {
  font-weight: 600;
  background: #fafafa;
  text-transform: uppercase;
  letter-spacing: 0.2px;
}

.description-cell {
  min-width: 240px;
  max-width: 400px;
  position: relative;
}

.description-cell :deep(.q-field__native) {
  padding-left: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.description-cell :deep(.description-input) {
  white-space: pre-wrap;
  word-break: break-word;
}

.description-cell :deep(textarea) {
  resize: none;
}

.description-editor {
  display: block;
}

.description-display {
  display: none;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  word-wrap: break-word;
  max-width: 100%;
}

.qty-cell :deep(.q-field__native) {
  text-align: center;
}

.price-cell :deep(.q-field__native) {
  text-align: right;
}

.total-label-cell {
  font-weight: 600;
}

.total-amount-cell {
  font-weight: 700;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

/* Mobile List Styles */
.mobile-list-container {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  scroll-behavior: smooth;
  border-radius: 8px;
  background: white;
}

/* Custom scrollbar for mobile list */
.mobile-list-container::-webkit-scrollbar {
  width: 8px;
}

.mobile-list-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.mobile-list-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.mobile-list-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.invoice-list {
  border-radius: 8px;
  overflow: visible;
}

.invoice-item {
  padding: 1rem;
  background: white;
  min-height: calc(100vh - 350px);
  display: flex;
  align-items: center;
}

.item-number {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #1976d2;
}

.description-field {
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
}

.mobile-total {
  background: #f5f5f5;
  border: 2px solid #1976d2;
  border-radius: 0 0 8px 8px;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

/* Print Layout Styles - List View */
.print-invoice-list {
  width: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.print-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid #ddd;
  min-height: 40px;
  gap: 15px;
}

.print-item:last-of-type {
  border-bottom: 1px solid #ddd;
}

.print-item-left {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.print-item-num {
  font-weight: bold;
  flex-shrink: 0;
  font-size: 15px;
  color: #000;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.print-item-desc {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
  font-size: 14px;
  color: #222;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.print-item-right {
  flex-shrink: 0;
  text-align: right;
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  color: #000;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.print-calculation {
  display: inline-block;
}

.print-grand-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  padding-top: 20px;
  margin-top: 10px;
  background: transparent;
  font-weight: bold;
  font-size: 17px;
  color: #000;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.print-total-left {
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #000;
}

.print-total-right {
  font-size: 19px;
  font-weight: bold;
  color: #000;
}

/* Mobile: Hide table, show list */
@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }

  .mobile-only {
    display: block;
  }

  .mobile-only .description-editor {
    display: block;
  }

  .mobile-only .description-display {
    display: none;
  }
}

@media print {
  .no-print {
    display: none !important;
  }

  /* Hide desktop and mobile views in print */
  .desktop-only {
    display: none !important;
  }

  .mobile-only {
    display: none !important;
  }

  /* Show only print view */
  .print-only {
    display: block !important;
  }

  .print-invoice-list {
    page-break-inside: auto;
  }

  .print-item {
    page-break-inside: avoid;
    page-break-after: auto;
    padding: 8px 0;
  }

  .print-item-num {
    font-size: 12px;
  }

  .print-item-desc {
    font-size: 11px;
    line-height: 1.3;
  }

  .print-item-right {
    font-size: 11px;
  }

  .print-grand-total {
    padding: 10px 0;
    padding-top: 15px;
    font-size: 14px;
  }

  .print-total-right {
    font-size: 16px;
  }
}

/* Export/Image Download Styles */
:deep(#printArea.exporting .desktop-only) {
  display: none !important;
}

:deep(#printArea.exporting .mobile-only) {
  display: none !important;
}

:deep(#printArea.exporting .print-only) {
  display: block !important;
}

:deep(#printArea.exporting .print-invoice-list) {
  width: auto;
  min-width: 100%;
}

:deep(#printArea.exporting .print-item) {
  padding: 10px 0;
  border-bottom: 1px solid #ddd;
}

:deep(#printArea.exporting .print-item-desc) {
  min-width: 300px;
  white-space: pre-wrap;
  word-break: break-word;
}

:deep(#printArea.exporting .print-grand-total) {
  padding: 12px 0;
  padding-top: 20px;
  margin-top: 10px;
  border-top: 2px solid #333;
  background: transparent;
}
</style>
