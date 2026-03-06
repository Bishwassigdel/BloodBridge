import Inventory from '../models/Inventory.js';
import InventoryLog from '../models/InventoryLog.js';
import Notification from '../models/Notification.js';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const getInventory = async (req, res) => {
  try {
    let inventory = await Inventory.find({ hospital: req.user._id })
      .sort({ bloodGroup: 1 })
      .lean();

    const existingGroups = new Set(inventory.map(item => item.bloodGroup));
    const missing = BLOOD_GROUPS.filter(g => !existingGroups.has(g));

    if (missing.length > 0) {
      const newItems = missing.map(group => ({
        hospital: req.user._id,
        bloodGroup: group,
        units: 0,
        lastRestockDate: new Date(),
        lastUpdated: new Date(),
      }));
      await Inventory.insertMany(newItems);
      inventory = await Inventory.find({ hospital: req.user._id })
        .sort({ bloodGroup: 1 })
        .lean();
    }

    res.status(200).json({ success: true, inventory });
  } catch (err) {
    console.error('getInventory error:', err);
    res.status(500).json({ success: false, message: 'Failed to load inventory' });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { bloodGroup, units, action, expiryDate, reason } = req.body;

    if (!BLOOD_GROUPS.includes(bloodGroup)) {
      return res.status(400).json({ success: false, message: 'Invalid blood group' });
    }
    if (!units || units < 1 || !Number.isInteger(units)) {
      return res.status(400).json({ success: false, message: 'Units must be positive integer' });
    }
    if (!['add', 'subtract'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    let item = await Inventory.findOne({ hospital: req.user._id, bloodGroup });

    if (!item) {
      item = new Inventory({ hospital: req.user._id, bloodGroup, units: 0 });
    }

    const beforeUnits = item.units;

    if (action === 'add') {
      item.units += units;
      item.lastRestockDate = new Date();

      if (expiryDate) {
        const newExpiry = new Date(expiryDate);
        if (!item.earliestExpiryDate || newExpiry < item.earliestExpiryDate) {
          item.earliestExpiryDate = newExpiry;
        }
      }
    } else {
      if (item.units < units) {
        return res.status(400).json({ success: false, message: `Insufficient units (${item.units} < ${units})` });
      }
      item.units -= units;
    }

    item.lastUpdated = new Date();
    await item.save();

    // Audit log with expiryDate for ADD actions
    await InventoryLog.create({
      hospital: req.user._id,
      bloodGroup,
      action,
      units,
      performedBy: req.user._id,
      reason: reason || (action === 'add' ? 'Restock' : 'Usage'),
      beforeUnits,
      afterUnits: item.units,
      expiryDate: action === 'add' && expiryDate ? new Date(expiryDate) : undefined,
    });

    // Alerts
    const isCriticalBlood = ['O+', 'O-'].includes(bloodGroup);
    const lowThreshold = isCriticalBlood ? 5 : 10;

    if (item.units < lowThreshold) {
      await Notification.create({
        user: req.user._id,
        message: `Low stock alert: ${bloodGroup} only ${item.units} units left!`,
        type: 'low_stock',
        severity: 'high',
      });
    }

    if (item.earliestExpiryDate && item.earliestExpiryDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
      await Notification.create({
        user: req.user._id,
        message: `Near expiry alert: ${bloodGroup} expires soon (${new Date(item.earliestExpiryDate).toLocaleDateString()})`,
        type: 'near_expiry',
        severity: 'medium',
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully ${action}ed ${units} units of ${bloodGroup}`,
      inventory: item,
    });
  } catch (err) {
    console.error('updateInventory error:', err);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

export const getInventoryLogs = async (req, res) => {
  try {
    const logs = await InventoryLog.find({ hospital: req.user._id })
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('performedBy', 'username')
      .lean();

    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load logs' });
  }
};