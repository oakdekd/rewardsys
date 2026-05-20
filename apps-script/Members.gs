// Member lifecycle: register, lookup, update.

function findMemberByLineUserId(lineUserId) {
  if (!lineUserId) return null;
  const found = findRowByColumn_(SHEET_NAMES.MEMBERS, 'line_user_id', lineUserId);
  return found ? rowToObject_(found.headers, found.values) : null;
}

function findMemberByPhone(phone) {
  if (!phone) return null;
  const normalized = normalizePhone_(phone);
  const found = findRowByColumn_(SHEET_NAMES.MEMBERS, 'phone', normalized);
  return found ? rowToObject_(found.headers, found.values) : null;
}

function registerMember(input) {
  const phone = normalizePhone_(input.phone);
  if (!phone || phone.length < 9) throw new Error('เบอร์โทรไม่ถูกต้อง');
  if (!input.name) throw new Error('กรุณากรอกชื่อ');

  const existingPhone = findMemberByPhone(phone);
  if (existingPhone) {
    if (input.lineUserId && !existingPhone.line_user_id) {
      updateRowByColumn_(SHEET_NAMES.MEMBERS, 'member_id', existingPhone.member_id, {
        line_user_id: input.lineUserId,
        last_active_at: now_()
      });
      existingPhone.line_user_id = input.lineUserId;
    }
    return existingPhone;
  }

  if (input.lineUserId) {
    const existingLine = findMemberByLineUserId(input.lineUserId);
    if (existingLine) return existingLine;
  }

  const member = {
    member_id: generateId_('M'),
    line_user_id: input.lineUserId || '',
    phone: phone,
    name: input.name,
    birthday: input.birthday || '',
    plate: (input.plate || '').toUpperCase(),
    vehicle_type: input.vehicleType || '',
    consent_marketing: !!input.consentMarketing,
    points_balance: 0,
    lifetime_points: 0,
    created_at: now_(),
    last_active_at: now_()
  };
  appendRow_(SHEET_NAMES.MEMBERS, member);
  return member;
}

function updateMember(memberId, updates) {
  const allowed = ['name', 'birthday', 'plate', 'vehicle_type', 'consent_marketing', 'line_user_id', 'phone'];
  const filtered = {};
  Object.keys(updates).forEach(k => {
    if (allowed.includes(k)) filtered[k] = updates[k];
  });
  if (filtered.plate) filtered.plate = String(filtered.plate).toUpperCase();
  if (filtered.phone) filtered.phone = normalizePhone_(filtered.phone);
  filtered.last_active_at = now_();
  return updateRowByColumn_(SHEET_NAMES.MEMBERS, 'member_id', memberId, filtered);
}

function addPointsToMember_(memberId, points) {
  const found = findRowByColumn_(SHEET_NAMES.MEMBERS, 'member_id', memberId);
  if (!found) throw new Error('ไม่พบสมาชิก');
  const member = rowToObject_(found.headers, found.values);
  const newBalance = Number(member.points_balance || 0) + points;
  const newLifetime = Number(member.lifetime_points || 0) + Math.max(0, points);
  updateRowByColumn_(SHEET_NAMES.MEMBERS, 'member_id', memberId, {
    points_balance: newBalance,
    lifetime_points: newLifetime,
    last_active_at: now_()
  });
  return newBalance;
}
