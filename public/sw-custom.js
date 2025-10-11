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

// Push notification event handler
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received", event);

  let notificationData = {
    title: "ChastityOS",
    body: "You have a new notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: "default",
    data: {},
  };

  // Parse notification payload
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log("[SW] Push payload:", payload);

      // FCM sends data in notification or data field
      if (payload.notification) {
        notificationData.title = payload.notification.title || notificationData.title;
        notificationData.body = payload.notification.body || notificationData.body;
        if (payload.notification.icon) {
          notificationData.icon = payload.notification.icon;
        }
      }

      if (payload.data) {
        notificationData.data = payload.data;
        notificationData.tag = payload.data.tag || notificationData.tag;
      }
    } catch (error) {
      console.error("[SW] Error parsing push payload:", error);
    }
  }

  // Display notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: false,
      vibrate: [200, 100, 200],
    })
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.notification.tag);
  event.notification.close();

  // Handle different notification types
  const data = event.notification.data || {};
  let targetUrl = "/";

  // Determine target URL based on notification type
  if (data.type === "task_assigned") {
    targetUrl = `/tasks`;
  } else if (data.type === "task_submitted") {
    targetUrl = `/keyholder`;
  } else if (data.type === "task_approved" || data.type === "task_rejected") {
    targetUrl = `/tasks`;
  } else if (data.type === "task_deadline" || data.type === "task_overdue") {
    targetUrl = `/tasks`;
  } else if (data.link) {
    targetUrl = data.link;
  }

  // Open or focus the app
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus().then((client) => {
              // Navigate to target URL
              if ("navigate" in client) {
                return client.navigate(targetUrl);
              }
              return client;
            });
          }
        }
        // No window open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle notification actions (if we add action buttons in the future)
self.addEventListener("notificationclick", (event) => {
  if (!event.action) {
    // Main notification click handled above
    return;
  }

  console.log("[SW] Notification action clicked:", event.action);
  event.notification.close();

  const data = event.notification.data || {};

  // Handle specific actions
  let actionUrl = "/";

  switch (event.action) {
    case "approve":
      actionUrl = `/keyholder/tasks/${data.taskId}?action=approve`;
      break;
    case "reject":
      actionUrl = `/keyholder/tasks/${data.taskId}?action=reject`;
      break;
    case "view":
      actionUrl = data.link || `/tasks/${data.taskId}`;
      break;
    default:
      actionUrl = data.link || "/";
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus().then((client) => {
              if ("navigate" in client) {
                return client.navigate(actionUrl);
              }
              return client;
            });
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(actionUrl);
        }
      })
  );
});

// Background sync event handler with retry support
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync event triggered:", event.tag);

  if (event.tag === "offline-queue-sync") {
    event.waitUntil(
      processOfflineQueue().catch((error) => {
        console.error("[SW] Background sync failed:", error);
        // Notify clients about sync failure
        notifyClients({
          type: "SYNC_FAILED",
          error: error.message,
          timestamp: Date.now(),
        });
        // Re-throw to allow browser to retry
        throw error;
      }),
    );
  }
});

// Periodic sync event handler
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "refresh-app-data") {
    event.waitUntil(refreshAppData());
  }
});

/**
 * Process the offline queue when back online
 * Implements exponential backoff retry logic (30s, 60s, 120s)
 */
async function processOfflineQueue() {
  try {
    console.log("[SW] Starting offline queue processing");

    // Open IndexedDB and get pending operations
    const db = await openDatabase();
    const operations = await getQueuedOperations(db);

    if (operations.length === 0) {
      console.log("[SW] No queued operations to process");
      await notifyClients({
        type: "SYNC_COMPLETE",
        processed: 0,
        failed: 0,
        timestamp: Date.now(),
      });
      return;
    }

    console.log(`[SW] Processing ${operations.length} queued operations`);

    // Notify the client that sync has started
    await notifyClients({
      type: "SYNC_STARTED",
      count: operations.length,
      timestamp: Date.now(),
    });

    // Process each operation with retry logic
    let processedCount = 0;
    let failedCount = 0;
    const MAX_RETRIES = 3;

    for (const operation of operations) {
      const retryCount = operation.retryCount || 0;

      // Skip if max retries exceeded
      if (retryCount >= MAX_RETRIES) {
        console.warn(
          `[SW] Operation ${operation.id} exceeded max retries (${MAX_RETRIES})`,
        );
        failedCount++;
        continue;
      }

      // Check if enough time has passed for retry (exponential backoff)
      if (operation.lastRetryAt) {
        const timeSinceLastRetry = Date.now() - operation.lastRetryAt;
        const retryDelay = 30 * 1000 * Math.pow(2, retryCount); // 30s, 60s, 120s

        if (timeSinceLastRetry < retryDelay) {
          console.log(
            `[SW] Operation ${operation.id} waiting for retry delay (${Math.round((retryDelay - timeSinceLastRetry) / 1000)}s remaining)`,
          );
          continue;
        }
      }

      try {
        await processOperation(operation);
        processedCount++;

        // Remove from queue on success
        await removeFromQueue(db, operation.id);
        console.log(`[SW] Successfully processed operation ${operation.id}`);
      } catch (error) {
        console.error(
          `[SW] Failed to process operation ${operation.id}:`,
          error,
        );
        failedCount++;

        // Update retry count
        await incrementRetryCount(db, operation.id);
      }
    }

    // Notify the client that sync is complete
    await notifyClients({
      type: "SYNC_COMPLETE",
      processed: processedCount,
      failed: failedCount,
      timestamp: Date.now(),
    });

    console.log(
      `[SW] Sync complete: ${processedCount} processed, ${failedCount} failed`,
    );

    // If there are still pending operations, re-register sync for retry
    if (failedCount > 0) {
      const remainingOps = await getQueuedOperations(db);
      if (remainingOps.length > 0) {
        console.log(
          `[SW] ${remainingOps.length} operations remain in queue, will retry later`,
        );
      }
    }
  } catch (error) {
    console.error("[SW] Error processing offline queue:", error);
    throw error; // Re-throw to trigger browser retry
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

/**
 * Increment retry count for an operation
 */
async function incrementRetryCount(db, operationId) {
  try {
    const transaction = db.transaction(["offlineQueue"], "readwrite");
    const store = transaction.objectStore("offlineQueue");
    const request = store.get(operationId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const operation = request.result;
        if (operation) {
          operation.retryCount = (operation.retryCount || 0) + 1;
          operation.lastRetryAt = Date.now();

          const updateRequest = store.put(operation);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] Error incrementing retry count:", error);
  }
}

/**
 * Remove an operation from the queue
 */
async function removeFromQueue(db, operationId) {
  try {
    const transaction = db.transaction(["offlineQueue"], "readwrite");
    const store = transaction.objectStore("offlineQueue");
    const request = store.delete(operationId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] Error removing from queue:", error);
  }
}

/**
 * Refresh app data during periodic sync
 * Notifies the client to handle the actual data fetching
 */
async function refreshAppData() {
  try {
    console.log("[SW] Periodic sync: refreshing app data");

    // Notify clients to refresh their data
    await notifyClients({
      type: "PERIODIC_SYNC",
      action: "REFRESH_DATA",
      timestamp: Date.now(),
    });

    console.log("[SW] Periodic sync: data refresh triggered");
  } catch (error) {
    console.error("[SW] Error during periodic sync:", error);
  }
}
