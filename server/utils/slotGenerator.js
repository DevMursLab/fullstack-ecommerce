const SLOT_INTERVAL = 15;

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function isOverlapping(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function getDayName(dateString) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date(dateString).getDay()];
}

function generateAvailableSlots({ staff, date, requiredDuration, existingAppointments }) {
  const dayName = getDayName(date);
  const schedule = staff.workingHours[dayName];
  if (!schedule || schedule.isOff) return [];
  const isOnLeave = staff.leaves.some((leave) => leave.date === date);
  if (isOnLeave) return [];
  const workStart = timeToMinutes(schedule.start);
  const workEnd = timeToMinutes(schedule.end);
  const busyRanges = existingAppointments
    .filter((appt) => appt.status !== 'cancelled')
    .map((appt) => ({ start: timeToMinutes(appt.startTime), end: timeToMinutes(appt.endTime) }));
  const today = new Date().toISOString().split('T')[0];
  const isToday = date === today;
  const nowMinutes = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : -1;
  const availableSlots = [];
  for (let slotStart = workStart; slotStart < workEnd; slotStart += SLOT_INTERVAL) {
    const slotEnd = slotStart + requiredDuration;
    if (slotEnd > workEnd) continue;
    if (isToday && slotStart < nowMinutes + 30) continue;
    const hasConflict = busyRanges.some((busy) => isOverlapping(slotStart, slotEnd, busy.start, busy.end));
    if (hasConflict) continue;
    availableSlots.push({
      time: minutesToTime(slotStart),
      endTime: minutesToTime(slotEnd),
      period: slotStart < 720 ? 'morning' : slotStart < 1020 ? 'afternoon' : 'evening',
    });
  }
  return availableSlots;
}

function generateSlotsForAnyStaff({ allStaff, date, requiredDuration, allAppointments }) {
  const slotMap = new Map();
  for (const staff of allStaff) {
    const staffAppointments = allAppointments.filter((a) => String(a.staffId) === String(staff._id));
    const slots = generateAvailableSlots({ staff, date, requiredDuration, existingAppointments: staffAppointments });
    for (const slot of slots) {
      if (!slotMap.has(slot.time)) slotMap.set(slot.time, []);
      slotMap.get(slot.time).push(staff._id);
    }
  }
  return [...slotMap.entries()]
    .map(([time, staffIds]) => ({ time, availableStaff: staffIds }))
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

function generateBookingNumber() {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `LM-${rand}`;
}

function generateOrderNumber() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LM-O-${rand}`;
}

module.exports = {
  generateAvailableSlots,
  generateSlotsForAnyStaff,
  timeToMinutes,
  minutesToTime,
  isOverlapping,
  getDayName,
  generateBookingNumber,
  generateOrderNumber,
};
