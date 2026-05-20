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

  const welcomeBonus = Number(getConfig('WELCOME_BONUS_POINTS')) || 50;
  const member = {
    member_id: generateId_('M'),
    line_user_id: input.lineUserId || '',
    phone: phone,
    name: input.name,
    birthday: input.birthday || '',
    plate: (input.plate || '').toUpperCase(),
    vehicle_type: input.vehicleType || '',
    consent_marketing: !!input.consentMarketing,
    points_balance: welcomeBonus,
    lifetime_points: welcomeBonus,
    created_at: now_(),
    last_active_at: now_()
  };
  appendRow_(SHEET_NAMES.MEMBERS, member);
  notifyMemberWelcome_(member, welcomeBonus);
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

function generateMemberQrPayload(memberId) {
  const ts = Math.floor(Date.now() / 1000);
  const sig = signQr_(memberId, ts);
  return `MEMBER|${memberId}|${ts}|${sig}`;
}

function verifyMemberQrPayload(payload) {
  if (!payload || typeof payload !== 'string') throw new Error('QR ไม่ถูกต้อง');
  const parts = payload.split('|');
  if (parts.length !== 4 || parts[0] !== 'MEMBER') throw new Error('QR ไม่ถูกต้อง');
  const [, memberId, tsStr, sig] = parts;
  const ts = Number(tsStr);
  const expected = signQr_(memberId, ts);
  if (expected !== sig) throw new Error('ลายเซ็น QR ไม่ตรง');
  const ttl = Number(getConfig('QR_TTL_SECONDS')) || 300;
  const age = Math.floor(Date.now() / 1000) - ts;
  if (age > ttl) throw new Error('QR หมดอายุ กรุณาให้ลูกค้าเปิด QR ใหม่');
  const found = findRowByColumn_(SHEET_NAMES.MEMBERS, 'member_id', memberId);
  if (!found) throw new Error('ไม่พบสมาชิก');
  return rowToObject_(found.headers, found.values);
}

function signQr_(memberId, ts) {
  const secret = getScriptProp_('QR_HMAC_SECRET') || 'dev-secret-change-me';
  const hmac = Utilities.computeHmacSha256Signature(memberId + '|' + ts, secret);
  return Utilities.base64EncodeWebSafe(hmac).replace(/=+$/, '').slice(0, 10);
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
