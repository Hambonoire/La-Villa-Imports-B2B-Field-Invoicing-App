// src/services/remoteInvoiceApi.js

/**
 * Thin wrapper around the remote WooCommerce (or other) API.
 * In tests, this module is fully mocked by Jest.
 */

async function createRemoteInvoice(payload) {
  // In production, call your real external API here.
  // For now, a simple placeholder; tests will mock this.
  throw new Error("createRemoteInvoice not implemented");
}

module.exports = {
  createRemoteInvoice,
};
