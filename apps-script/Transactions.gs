// Staff records a sale here. Points are calculated from the baht amount
// and the payment-method bonus, then credited to the member.

function recordTransaction(input) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return recordTransactionLocked_(input);
  } finally {
    lock.releaseLock();
  }
}

function recordTransactionLocked_(input) {
  if (!input.memberId && !input.phone) throw new Error('ต้องระบุสมาชิก');
  if (!input.amount || input.amount <= 0) throw new Error('ยอดเงินไม่ถูกต้อง');

  let member = input.memberId
    ? rowToObjectOrNull_(findRowByColumn_(SHEET_NAMES.MEMBERS, 'member_id', input.memberId))
    : findMemberByPhone(input.phone);
  if (!member) throw new Error('ไม่พบสมาชิก');

  const points = calculatePoints_(input.amount, input.paymentMethod);

  const txn = {
    txn_id: generateId_('T'),
    timestamp: now_(),
    member_id: member.member_id,
    phone: member.phone,
    fuel_type: input.fuelType || '',
    liters: Number(input.liters) || '',
    amount_thb: Number(input.amount),
    payment_method: input.paymentMethod || '',
    points_earned: points,
    plate: (input.plate || member.plate || '').toUpperCase(),
    staff_id: input.staffId || '',
    note: input.note || ''
  };
  appendRow_(SHEET_NAMES.TRANSACTIONS, txn);

  if (input.plate && input.plate.toUpperCase() !== (member.plate || '').toUpperCase()) {
    updateRowByColumn_(SHEET_NAMES.MEMBERS, 'member_id', member.member_id, {
      plate: input.plate.toUpperCase()
    });
  }

  const newBalance = addPointsToMember_(member.member_id, points);

  notifyMemberPointsEarned_(member, txn, newBalance);

  return { txn, points, newBalance, member };
}

function calculatePoints_(amount, paymentMethod) {
  const thbPerUnit = Number(getConfig('EARN_THB_PER_UNIT')) || 45;
  const pointsPerUnit = Number(getConfig('EARN_POINTS_PER_UNIT')) || 10;
  const base = (Number(amount) / thbPerUnit) * pointsPerUnit;

  let multiplier = 1.0;
  if (paymentMethod === 'cash') multiplier = Number(getConfig('BONUS_CASH')) || 1.0;
  else if (paymentMethod === 'qr') multiplier = Number(getConfig('BONUS_QR')) || 1.0;
  else if (paymentMethod === 'credit') multiplier = Number(getConfig('BONUS_CREDIT')) || 1.0;

  return Math.floor(base * multiplier);
}

function listMemberTransactions(memberId, limit) {
  const all = listRows_(SHEET_NAMES.TRANSACTIONS)
    .filter(t => t.member_id === memberId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return limit ? all.slice(0, limit) : all;
}

function rowToObjectOrNull_(found) {
  return found ? rowToObject_(found.headers, found.values) : null;
}
