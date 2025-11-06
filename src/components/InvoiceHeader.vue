<template>
  <div class="header-wrapper">
    <div class="header-display">
      <h2 class="business-name">
        <span class="editable" tabindex="0">
          {{ displayShopName }}
          <q-popup-edit v-model="mutableShopName" buttons v-slot="scope" class="no-print">
            <q-input v-model="scope.value" dense autofocus label="Business Name" />
          </q-popup-edit>
        </span>
      </h2>
      <p class="date-line">
        Date:
        <span class="editable" tabindex="0">
          {{ displayDate || '--/--/----' }}
          <q-popup-edit v-model="mutableDate" buttons v-slot="scope" class="no-print">
            <q-input v-model="scope.value" type="date" dense autofocus label="Invoice Date" />
          </q-popup-edit>
        </span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  shopName: {
    type: String,
    default: ''
  },
  date: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:shopName', 'update:date'])

const mutableShopName = computed({
  get: () => props.shopName,
  set: (value) => emit('update:shopName', value)
})

const mutableDate = computed({
  get: () => props.date,
  set: (value) => emit('update:date', value)
})

const displayShopName = computed(() => {
  const name = (props.shopName || '').trim()
  return name.length > 0 ? name : 'BUSINESS NAME'
})

const displayDate = computed(() => {
  const raw = (props.date || '').trim()
  if (!raw) return ''
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
})
</script>

<style scoped>
.header-wrapper {
  margin-bottom: 1.25rem;
}

.header-display {
  text-align: center;
  border-bottom: 1px solid #000;
  padding-bottom: 6px;
}

.business-name {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin: 0 0 2px 0;
  color: #000;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.editable {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  border-bottom: 1px dashed transparent;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.editable:focus,
.editable:hover {
  border-bottom-color: rgba(0, 0, 0, 0.3);
}

.date-line {
  font-size: 12px;
  color: #000;
  margin: 0;
  line-height: 1.2;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@media print {
  .no-print {
    display: none !important;
  }

  .header-wrapper {
    margin-bottom: 10px;
  }

  .header-display {
    padding-bottom: 5px;
  }

  .business-name {
    font-size: 20px;
  }
}
</style>
