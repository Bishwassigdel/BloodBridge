import Inventory from '../models/Inventory.js';

export const updateInventory = async (req, res) => {
  try {
    const { bloodGroup, units, action } = req.body; // action = 'add' or 'subtract'

    let inventory = await Inventory.findOne({
      hospital: req.user._id,
      bloodGroup,
    });

    if (!inventory) {
      inventory = new Inventory({ hospital: req.user._id, bloodGroup, units: 0 });
    }

    if (action === 'add') {
      inventory.units += Number(units);
    } else {
      inventory.units = Math.max(0, inventory.units - Number(units));
    }

    inventory.lastUpdated = new Date();
    await inventory.save();

    res.json({ success: true, inventory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find({ hospital: req.user._id });
    res.json({ success: true, inventory });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};