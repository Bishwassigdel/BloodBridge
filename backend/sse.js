// backend/sse.js
// Server-Sent Events (SSE) client manager
// No npm packages needed — built into Node.js / browsers

const clients = new Map();
// Map<userId (string), { res, bloodGroup, role }>

/**
 * Register a new SSE client
 */
export const addSSEClient = (userId, res, bloodGroup, role) => {
  clients.set(userId.toString(), { res, bloodGroup, role });
  console.log(`[SSE] Client connected: ${userId} (${role}, ${bloodGroup || 'no-blood-group'}). Total: ${clients.size}`);
};

/**
 * Remove a disconnected SSE client
 */
export const removeSSEClient = (userId) => {
  clients.delete(userId.toString());
  console.log(`[SSE] Client disconnected: ${userId}. Total: ${clients.size}`);
};

/**
 * Send an SSE event to a specific user
 */
export const sendToUser = (userId, event, data) => {
  const client = clients.get(userId.toString());
  if (client) {
    try {
      client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      console.log(`[SSE] Sent "${event}" to user ${userId}`);
    } catch (err) {
      console.error(`[SSE] Failed to send to user ${userId}:`, err.message);
      removeSSEClient(userId);
    }
  }
};

/**
 * Broadcast an SSE event to all donors with a matching blood group
 * (excludes the sender/requester)
 */
export const broadcastToBloodGroup = (bloodGroup, event, data, excludeUserId = null) => {
  let sent = 0;
  clients.forEach((client, userId) => {
    if (
      client.role === 'donor' &&
      client.bloodGroup === bloodGroup &&
      userId !== excludeUserId?.toString()
    ) {
      try {
        client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        sent++;
      } catch (err) {
        console.error(`[SSE] Failed to broadcast to ${userId}:`, err.message);
        removeSSEClient(userId);
      }
    }
  });
  console.log(`[SSE] Broadcasted "${event}" to ${sent} ${bloodGroup} donors`);
  return sent;
};

/**
 * Broadcast an SSE event to ALL donors (including cooldown) with matching blood group
 * Used for re-escalation
 */
export const broadcastToAllBloodGroup = (bloodGroup, event, data, excludeUserId = null) => {
  let sent = 0;
  clients.forEach((client, userId) => {
    if (
      client.role === 'donor' &&
      client.bloodGroup === bloodGroup &&
      userId !== excludeUserId?.toString()
    ) {
      try {
        client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        sent++;
      } catch (err) {
        console.error(`[SSE] Failed to escalation-broadcast to ${userId}:`, err.message);
        removeSSEClient(userId);
      }
    }
  });
  console.log(`[SSE] Escalation broadcasted "${event}" to ${sent} ${bloodGroup} donors`);
  return sent;
};

/**
 * Broadcast an SSE event to ALL donors and receivers (e.g. new hospital event)
 */
export const broadcastToAllDonorsReceivers = (event, data) => {
  let sent = 0;
  clients.forEach((client, userId) => {
    if (client.role === 'donor' || client.role === 'receiver') {
      try {
        client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        sent++;
      } catch (err) {
        console.error(`[SSE] Failed to broadcast event to ${userId}:`, err.message);
        removeSSEClient(userId);
      }
    }
  });
  console.log(`[SSE] Broadcasted "${event}" to ${sent} donors/receivers`);
  return sent;
};
