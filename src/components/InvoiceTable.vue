<template>
  <div class="table-section">
    <div class="table-wrapper">
      <table class="inv-table">
        <thead>
          <tr>
            <th style="width: 50px;">#</th>
            <th>Description</th>
            <th style="width: 90px;">Qty</th>
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
                  placeholder="Item description" input-class="description-input" />
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
            <td class="price-cell">
              <q-input v-model.number="row.price" type="number" min="0" step="0.01" dense borderless
                class="text-right" />
            </td>
            <td class="text-right">{{ formatMoney(rowTotal(row)) }}</td>
            <td class="no-print text-center">
              <q-btn flat round dense icon="close" size="sm" @click="$emit('remove-row', i)" />
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="total-row-table">
            <td colspan="4" class="text-right total-label-cell">
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

    <!-- Add Row Button -->
    <div class="add-row-section no-print">
      <q-btn outline color="primary" icon="add" label="Add New" class="add-row-button" @click="$emit('add-row')" />
      <q-btn round color="primary" icon="print" class="action-icon-button" aria-label="Print invoice"
        @click="$emit('print-invoice')" />
      <q-btn round color="secondary" icon="image" class="action-icon-button" aria-label="Export invoice snapshot"
        @click="$emit('download-image')" />
      <q-btn round color="negative" icon="refresh" class="action-icon-button" aria-label="Reset invoice"
        @click="$emit('reset-invoice')" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  rows: {
    type: Array,
    required: true
  }
})

defineEmits(['add-row', 'remove-row', 'print-invoice', 'download-image', 'reset-invoice'])

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

.add-row-section {
  margin: 0.75rem 0 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.add-row-button {
  min-width: 140px;
}

.action-icon-button {
  flex-shrink: 0;
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

@media print {
  .no-print {
    display: none !important;
  }

  .description-editor {
    display: none !important;
  }

  .description-display {
    display: block;
  }

  .table-wrapper {
    margin-bottom: 0;
  }

  .inv-table {
    page-break-inside: auto;
    border: 1px solid #000;
  }

  .inv-table tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  .inv-table th,
  .inv-table td {
    padding: 3px 5px;
    font-size: 10.5px;
    line-height: 1.15;
  }

  .inv-table thead th {
    background: #fff !important;
  }

  .total-label-cell,
  .total-amount-cell {
    padding: 6px !important;
  }
}

:deep(#printArea.exporting .description-editor) {
  display: none !important;
}

:deep(#printArea.exporting .description-display) {
  display: block !important;
  white-space: pre-wrap !important;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
}

:deep(#printArea.exporting .inv-table) {
  width: auto;
  min-width: 100%;
  table-layout: auto;
}

:deep(#printArea.exporting .description-cell) {
  max-width: 900px;
  min-width: 600px;
  width: 900px;
}
</style>
