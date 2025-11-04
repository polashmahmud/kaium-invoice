const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'list', component: () => import('pages/InvoiceListPage.vue') },
      { path: 'preview', component: () => import('pages/InvoicePreviewPage.vue') },
      { path: 'preview/:id', component: () => import('pages/InvoicePreviewPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
