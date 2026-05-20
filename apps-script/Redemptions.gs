// Customer redeems points for a reward. A short coupon code is returned;
// staff verifies the code on screen at the pump and marks it used.

function listActiveRewards() {
  return listRows_(SHEET_NAMES.REWARDS).filter(r => r.active === true || r.active === 'TRUE' || r.active === 'true');
}

function redeemReward(input) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return redeemRewardLocked_(input);
  } finally {
    lock.releaseLock();
  }
}

function redeemRewardLocked_(input) {
  if (!input.memberId) throw new Error('ต้องระบุสมาชิก');
  if (!input.rewardId) throw new Error('ต้องระบุของรางวัล');

  const found = findRowByColumn_(SHEET_NAMES.MEMBERS, 'member_id', input.memberId);
  if (!found) throw new Error('ไม่พบสมาชิก');
  const member = rowToObject_(found.headers, found.values);

  const reward = listActiveRewards().find(r => r.reward_id === input.rewardId);
  if (!reward) throw new Error('ของรางวัลนี้ไม่มีให้บริการแล้ว');

  const cost = Number(reward.points_cost);
  if (Number(member.points_balance) < cost) throw new Error('แต้มไม่พอ');

  addPointsToMember_(member.member_id, -cost);

  const coupon = {
    redemption_id: generateId_('R'),
    timestamp: now_(),
    member_id: member.member_id,
    reward_id: reward.reward_id,
    reward_name: reward.name,
    points_used: cost,
    value_thb: Number(reward.value_thb),
    coupon_code: generateCouponCode_(),
    status: 'issued',
    used_at: '',
    staff_id: ''
  };
  appendRow_(SHEET_NAMES.REDEMPTIONS, coupon);

  notifyMemberRedemption_(member, coupon);
  return coupon;
}

function markCouponUsed(couponCode, staffId) {
  const found = findRowByColumn_(SHEET_NAMES.REDEMPTIONS, 'coupon_code', couponCode);
  if (!found) throw new Error('ไม่พบรหัสคูปอง');
  const coupon = rowToObject_(found.headers, found.values);
  if (coupon.status === 'used') throw new Error('คูปองนี้ถูกใช้ไปแล้ว');
  updateRowByColumn_(SHEET_NAMES.REDEMPTIONS, 'coupon_code', couponCode, {
    status: 'used',
    used_at: now_(),
    staff_id: staffId || ''
  });
  return Object.assign(coupon, { status: 'used', used_at: now_() });
}

function listMemberRedemptions(memberId, limit) {
  const all = listRows_(SHEET_NAMES.REDEMPTIONS)
    .filter(r => r.member_id === memberId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return limit ? all.slice(0, limit) : all;
}

function generateCouponCode_() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out.slice(0, 4) + '-' + out.slice(4);
}
