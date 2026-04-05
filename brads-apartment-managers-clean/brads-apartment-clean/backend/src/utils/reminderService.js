const Unit = require('../models/Unit');
const Notification = require('../models/Notification');

// Returns the next 5th-of-month due date from a given reference date
function getNextDueDateFrom(referenceDate) {
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);
  let due = new Date(d.getFullYear(), d.getMonth(), 5);
  if (d.getDate() >= 5) {
    due = new Date(d.getFullYear(), d.getMonth() + 1, 5);
  }
  return due;
}

async function processRentReminders() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ----------------------------------------------------------------
    // Step 1: Reset payment status for all occupied units whose
    // nextDueDate has arrived (i.e. it is the 5th of a new month).
    // This handles continuing tenants — their rent resets each cycle.
    // ----------------------------------------------------------------
    const unitsToReset = await Unit.find({
      status: 'occupied',
      tenant: { $ne: null },
      paymentStatus: 'paid',
      nextDueDate: { $lte: today },
    });

    for (const unit of unitsToReset) {
      // Advance the due date to next month's 5th and flip to unpaid
      const newDueDate = getNextDueDateFrom(today);
      await Unit.findByIdAndUpdate(unit._id, {
        paymentStatus: 'unpaid',
        nextDueDate: newDueDate,
      });
      console.log(`Reset rent for unit ${unit.unitNumber} — new due date: ${newDueDate.toDateString()}`);
    }

    // ----------------------------------------------------------------
    // Step 2: Send reminders for all occupied unpaid units
    // ----------------------------------------------------------------
    const units = await Unit.find({
      status: 'occupied',
      tenant: { $ne: null },
      nextDueDate: { $ne: null },
      paymentStatus: 'unpaid',
    }).populate('tenant');

    for (const unit of units) {
      if (!unit.tenant) continue;

      const dueDate = new Date(unit.nextDueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

      let notifData = null;

      if (diffDays === 3) {
        notifData = {
          title: 'Rent Due Soon',
          message: `Your rent of KES ${unit.rentPrice.toLocaleString()} is due in 3 days (${dueDate.toDateString()}).`,
          type: 'reminder',
        };
      } else if (diffDays === 0) {
        notifData = {
          title: 'Rent Due Today',
          message: `Your rent of KES ${unit.rentPrice.toLocaleString()} is due today. Please pay to avoid penalties.`,
          type: 'reminder',
        };
      } else if (diffDays === -3) {
        notifData = {
          title: 'Rent Overdue',
          message: `Your rent of KES ${unit.rentPrice.toLocaleString()} was due on ${dueDate.toDateString()}. Please pay immediately.`,
          type: 'overdue',
        };
      }

      if (notifData) {
        // Avoid duplicate notifications on the same day
        const existing = await Notification.findOne({
          user: unit.tenant._id,
          unit: unit._id,
          title: notifData.title,
          createdAt: { $gte: today },
        });
        if (!existing) {
          await Notification.create({
            user: unit.tenant._id,
            unit: unit._id,
            ...notifData,
          });
        }
      }
    }

    console.log('Rent reminders processed');
  } catch (err) {
    console.error('Reminder processing error:', err.message);
  }
}

module.exports = { processRentReminders };
