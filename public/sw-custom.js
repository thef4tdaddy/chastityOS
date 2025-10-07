/**
 * Custom Service Worker
 * Extends Workbox with background sync for offline queue processing
 */

// Listen for SKIP_WAITING message to activate immediately
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Background sync event handler
self.addEventListener("sync", (event) => {
  if (event.tag === "offline-queue-sync") {
    event.waitUntil(processOfflineQueue());
  }
});

/**
 * Process the offline queue when back online
 */
async function processOfflineQueue() {
  try {
    // Open IndexedDB and get pending operations
    const db = await openDatabase();
    const operations = await getQueuedOperations(db);

    if (operations.length === 0) {
      console.log("[SW] No queued operations to process");
      return;
    }

    console.log(`[SW] Processing ${operations.length} queued operations`);

    // Notify the client that sync has started
    await notifyClients({
      type: "SYNC_STARTED",
      count: operations.length,
    });

    // Process each operation
    let processedCount = 0;
    let failedCount = 0;

    for (const operation of operations) {
      try {
        await processOperation(operation);
        processedCount++;
      } catch (error) {
        console.error("[SW] Failed to process operation:", error);
        failedCount++;
      }
    }

    // Notify the client that sync is complete
    await notifyClients({
      type: "SYNC_COMPLETE",
      processed: processedCount,
      failed: failedCount,
    });

    console.log(
      `[SW] Sync complete: ${processedCount} processed, ${failedCount} failed`,
    );
  } catch (error) {
    console.error("[SW] Error processing offline queue:", error);
  }
}

/**
 * Open the IndexedDB database
 */
async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ChastityOS", 1);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Get queued operations from IndexedDB
 */
async function getQueuedOperations(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["offlineQueue"], "readonly");
    const store = transaction.objectStore("offlineQueue");
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Process a single operation
 * Note: This will notify the client to handle the actual processing
 * since the service worker cannot directly access Firebase
 */
async function processOperation(operation) {
  // Notify the client to process this operation
  await notifyClients({
    type: "PROCESS_OPERATION",
    operation: operation,
  });
}

/**
 * Notify all clients about sync status
 */
async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage(message);
  });
}
