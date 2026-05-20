function generateId_(prefix) {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.floor(Math.random() * 0xffff).toString(36).toUpperCase().padStart(3, '0');
  return prefix + ts + rnd;
}

function now_() {
  return Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');
}

function normalizePhone_(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('66')) return '0' + digits.slice(2);
  return digits;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function isStaff_(lineUserId) {
  if (!lineUserId) return false;
  const found = findRowByColumn_(SHEET_NAMES.STAFF, 'line_user_id', lineUserId);
  if (!found) return false;
  const staff = rowToObject_(found.headers, found.values);
  return staff.active === true || staff.active === 'TRUE' || staff.active === 'true';
}
