<template>
    <q-page class="list-page">
        <div class="list-container">
            <div class="page-header">
                <h5 class="page-title">
                    All Invoices
                    <q-badge color="primary" :label="invoices.length" class="q-ml-sm" />
                </h5>
                <q-btn icon="refresh" flat round dense @click="loadInvoices" />
            </div>

            <q-list v-if="invoices.length > 0" bordered separator class="invoice-list">
                <q-slide-item v-for="invoice in invoices" :key="invoice.id" @left="() => onSwipeLeft(invoice)"
                    @right="() => onSwipeRight(invoice)" left-color="primary" right-color="negative">

                    <template v-slot:left>
                        <q-icon name="edit" />
                    </template>

                    <template v-slot:right>
                        <q-icon name="delete" />
                    </template>

                    <q-item @click="viewInvoice(invoice.id)" clickable>
                        <q-item-section>
                            <q-item-label>
                                <strong>{{ invoice.shopName || 'Untitled Invoice' }}</strong>
                            </q-item-label>
                            <q-item-label caption lines="2">
                                {{ getInvoiceSummary(invoice) }}
                            </q-item-label>
                        </q-item-section>

                        <q-item-section side top>
                            <q-item-label caption>{{ formatDate(invoice.createdAt) }}</q-item-label>
                            <q-badge color="primary" :label="`${invoice.rows.length} items`" />
                        </q-item-section>
                    </q-item>
                </q-slide-item>
            </q-list>

            <div v-else class="empty-state">
                <q-icon name="receipt_long" size="64px" color="grey-5" />
                <p class="text-grey-6">No invoices found</p>
                <q-btn color="primary" label="Create Invoice" icon="add" @click="goToHome" />
            </div>
        </div>
    </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllInvoices, deleteInvoice, setCurrentInvoiceId } from 'src/utils/db.js'

const router = useRouter()
const invoices = ref([])

onMounted(async () => {
    await loadInvoices()
})

async function loadInvoices() {
    try {
        const allInvoices = await getAllInvoices()
        // Sort by ID descending (newest first)
        invoices.value = allInvoices.sort((a, b) => b.id - a.id)
    } catch (error) {
        console.error('Error loading invoices:', error)
    }
}

function getInvoiceSummary(invoice) {
    const totalItems = invoice.rows.length
    const totalAmount = invoice.rows.reduce((sum, row) => {
        return sum + (row.qty * row.price)
    }, 0)

    return `${totalItems} items • Total: ${formatMoney(totalAmount)}`
}

function formatMoney(n) {
    return Number(n || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
}

function formatDate(dateString) {
    if (!dateString) return ''

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return date.toLocaleDateString()
}

function viewInvoice(invoiceId) {
    // Navigate to preview page with invoice ID
    router.push(`/preview/${invoiceId}`)
}

// Swipe left - Edit
function onSwipeLeft(invoice) {
    // Set this invoice as current invoice
    setCurrentInvoiceId(invoice.id)

    // Navigate to home page
    router.push('/')
}

// Swipe right - Delete
async function onSwipeRight(invoice) {
    const confirmed = confirm(`Are you sure you want to delete "${invoice.shopName || 'Untitled Invoice'}"?`)

    if (confirmed) {
        await handleDelete(invoice.id)
    }
}

async function handleDelete(invoiceId) {
    try {
        await deleteInvoice(invoiceId)

        // Reload the list
        await loadInvoices()

        // Optional: Show success message
        console.log('Invoice deleted successfully')
    } catch (error) {
        console.error('Error deleting invoice:', error)
        alert('Failed to delete invoice. Please try again.')
    }
}

function goToHome() {
    router.push('/')
}
</script>

<style scoped>
.list-page {
    background: #f5f5f5;
    min-height: 100vh;
    padding: 1rem;
}

.list-container {
    max-width: 900px;
    margin: 0 auto;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0 0.5rem;
}

.page-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #333;
}

.invoice-list {
    background: white;
    border-radius: 8px;
    overflow: hidden;
}

.invoice-list .q-item {
    padding: 1rem;
    transition: background-color 0.2s;
}

.invoice-list .q-item:hover {
    background-color: #f5f5f5;
}

.empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 8px;
}

.empty-state p {
    margin: 1rem 0 2rem;
    font-size: 1.1rem;
}

@media print {
    .list-page {
        display: none;
    }
}
</style>
