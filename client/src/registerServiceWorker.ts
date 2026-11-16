/* eslint-disable no-console */

import { register } from 'register-service-worker'

if (process.env.NODE_ENV === 'production') {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {
      console.log('✅ Service worker ready.')
    },

    registered() {
      console.log('✅ Service worker registered.')
    },

    cached() {
      console.log('📦 Content cached for offline use.')
    },

    updatefound() {
      console.log('⬇️ New content downloading.')
    },

    updated() {
      console.log('♻️ New content available.')
    },

    offline() {
      console.log('📡 Offline mode.')
    },

    error(error) {
      console.error('❌ Service worker error:', error)
    },
  })
}