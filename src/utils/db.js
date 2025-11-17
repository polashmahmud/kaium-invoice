// IndexedDB helper for Invoice Management

const DB_NAME = 'InvoiceDB'
const DB_VERSION = 2
const STORE_NAME = 'invoices'
const SETTINGS_STORE_NAME = 'settings'
const CURRENT_INVOICE_KEY = 'currentInvoiceId'
const ACTIVATION_KEY = 'activation'

let db = null

// Helper function to convert reactive objects to plain objects
function toPlainObject(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// Initialize Database
export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      db = event.target.result

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        })

        // Create indexes
        objectStore.createIndex('createdAt', 'createdAt', { unique: false })
        objectStore.createIndex('updatedAt', 'updatedAt', { unique: false })
      }

      // Create settings store for activation status
      if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
        db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'key' })
      }
    }
  })
}

// Create new invoice
export async function createInvoice(invoiceData) {
  if (!db) await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    // Convert to plain object to avoid DataCloneError
    const plainData = toPlainObject(invoiceData)

    const invoice = {
      ...plainData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const request = store.add(invoice)

    request.onsuccess = () => {
      const invoiceId = request.result
      // Save current invoice ID to localStorage
      localStorage.setItem(CURRENT_INVOICE_KEY, invoiceId)
      resolve(invoiceId)
    }

    request.onerror = () => reject(request.error)
  })
}

// Get invoice by ID
export async function getInvoice(id) {
  if (!db) await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Update invoice
export async function updateInvoice(id, invoiceData) {
  if (!db) await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    // First get the existing invoice
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const existingInvoice = getRequest.result

      if (existingInvoice) {
        // Convert to plain object to avoid DataCloneError
        const plainData = toPlainObject(invoiceData)

        const updatedInvoice = {
          ...existingInvoice,
          ...plainData,
          id: id, // Keep the same ID
          updatedAt: new Date().toISOString(),
        }

        const putRequest = store.put(updatedInvoice)

        putRequest.onsuccess = () => resolve(updatedInvoice)
        putRequest.onerror = () => reject(putRequest.error)
      } else {
        reject(new Error('Invoice not found'))
      }
    }

    getRequest.onerror = () => reject(getRequest.error)
  })
}

// Delete invoice
export async function deleteInvoice(id) {
  if (!db) await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Get all invoices
export async function getAllInvoices() {
  if (!db) await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Get current invoice ID from localStorage
export function getCurrentInvoiceId() {
  const id = localStorage.getItem(CURRENT_INVOICE_KEY)
  return id ? parseInt(id) : null
}

// Set current invoice ID in localStorage
export function setCurrentInvoiceId(id) {
  localStorage.setItem(CURRENT_INVOICE_KEY, id)
}

// Clear current invoice ID
export function clearCurrentInvoiceId() {
  localStorage.removeItem(CURRENT_INVOICE_KEY)
}

// Activation Management Functions
const CORRECT_KEY = 'Polash123.@$'

// Get activation status
export async function getActivationStatus() {
  if (!db) await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SETTINGS_STORE_NAME], 'readonly')
    const store = transaction.objectStore(SETTINGS_STORE_NAME)
    const request = store.get(ACTIVATION_KEY)

    request.onsuccess = () => {
      const result = request.result
      if (result) {
        resolve({
          isActivated: result.isActivated || false,
          attempts: result.attempts || 0,
          isPermanentlyLocked: result.isPermanentlyLocked || false,
        })
      } else {
        // First time - not activated
        resolve({
          isActivated: false,
          attempts: 0,
          isPermanentlyLocked: false,
        })
      }
    }
    request.onerror = () => reject(request.error)
  })
}

// Verify activation key
export async function verifyActivationKey(inputKey) {
  if (!db) await initDB()

  const currentStatus = await getActivationStatus()

  // Check if permanently locked
  if (currentStatus.isPermanentlyLocked) {
    return {
      success: false,
      isPermanentlyLocked: true,
      message: 'Your app is permanently locked',
    }
  }

  // Verify the key
  if (inputKey === CORRECT_KEY) {
    // Correct key - activate the app
    await saveActivationStatus({
      isActivated: true,
      attempts: 0,
      isPermanentlyLocked: false,
    })
    return {
      success: true,
      isActivated: true,
      message: 'App activated successfully',
    }
  } else {
    // Wrong key - increment attempts
    const newAttempts = currentStatus.attempts + 1
    const isPermanentlyLocked = newAttempts >= 3

    await saveActivationStatus({
      isActivated: false,
      attempts: newAttempts,
      isPermanentlyLocked: isPermanentlyLocked,
    })

    return {
      success: false,
      attempts: newAttempts,
      isPermanentlyLocked: isPermanentlyLocked,
      message: isPermanentlyLocked
        ? 'Your app is permanently locked'
        : `Wrong activation key. ${3 - newAttempts} attempts remaining`,
    }
  }
}

// Save activation status
async function saveActivationStatus(status) {
  if (!db) await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SETTINGS_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(SETTINGS_STORE_NAME)

    const data = {
      key: ACTIVATION_KEY,
      ...status,
      updatedAt: new Date().toISOString(),
    }

    const request = store.put(data)

    request.onsuccess = () => resolve(data)
    request.onerror = () => reject(request.error)
  })
}
