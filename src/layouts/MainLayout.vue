<template>
  <q-layout view="lHh Lpr lFf">
    <!-- <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Simple Invoice </q-toolbar-title>
      </q-toolbar>
    </q-header> -->

    <!-- <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Essential Links </q-item-label>

        <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer> -->

    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Footer -->
    <q-footer elevated class="bg-white text-dark">
      <q-toolbar class="footer-toolbar">
        <q-btn flat icon="home" label="Home" class="footer-btn" to="/" />
        <q-btn flat icon="receipt_long" class="footer-btn" to="/list">
          <span>Invoices</span>
          <q-badge color="primary" :label="invoiceCount" class="q-ml-xs" v-if="invoiceCount > 0" />
        </q-btn>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getAllInvoices } from 'src/utils/db.js'
//import EssentialLink from 'components/EssentialLink.vue'

const route = useRoute()
const invoiceCount = ref(0)

// Load invoice count on mount
onMounted(async () => {
  await updateInvoiceCount()
})

// Watch route changes to update count
watch(() => route.path, async () => {
  await updateInvoiceCount()
})

async function updateInvoiceCount() {
  try {
    const invoices = await getAllInvoices()
    invoiceCount.value = invoices.length
  } catch (error) {
    console.error('Error loading invoice count:', error)
  }
}

// const linksList = [
//   {
//     title: 'Docs',
//     caption: 'quasar.dev',
//     icon: 'school',
//     link: 'https://quasar.dev',
//   },
//   {
//     title: 'Github',
//     caption: 'github.com/quasarframework',
//     icon: 'code',
//     link: 'https://github.com/quasarframework',
//   },
//   {
//     title: 'Discord Chat Channel',
//     caption: 'chat.quasar.dev',
//     icon: 'chat',
//     link: 'https://chat.quasar.dev',
//   },
//   {
//     title: 'Forum',
//     caption: 'forum.quasar.dev',
//     icon: 'record_voice_over',
//     link: 'https://forum.quasar.dev',
//   },
//   {
//     title: 'Twitter',
//     caption: '@quasarframework',
//     icon: 'rss_feed',
//     link: 'https://twitter.quasar.dev',
//   },
//   {
//     title: 'Facebook',
//     caption: '@QuasarFramework',
//     icon: 'public',
//     link: 'https://facebook.quasar.dev',
//   },
//   {
//     title: 'Quasar Awesome',
//     caption: 'Community Quasar projects',
//     icon: 'favorite',
//     link: 'https://awesome.quasar.dev',
//   },
// ]

// const leftDrawerOpen = ref(false)

// function toggleLeftDrawer() {
//   leftDrawerOpen.value = !leftDrawerOpen.value
// }
</script>

<style scoped>
.footer-toolbar {
  display: flex;
  justify-content: space-around;
  padding: 0.5rem 0;
  border-top: 1px solid #e0e0e0;
}

.footer-btn {
  flex: 1;
  max-width: 200px;
  font-size: 0.9rem;
}

@media print {
  .q-footer {
    display: none !important;
  }
}
</style>
