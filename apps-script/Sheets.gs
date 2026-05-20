// Sheet schema and accessors. Run setupSheets() once after creating the
// spreadsheet to initialise headers, seed rewards, and seed config.

const SCHEMA = {
  Members: [
    'member_id', 'line_user_id', 'phone', 'name', 'birthday',
    'plate', 'vehicle_type', 'consent_marketing',
    'points_balance', 'lifetime_points', 'created_at', 'last_active_at'
  ],
  Transactions: [
    'txn_id', 'timestamp', 'member_id', 'phone',
    'fuel_type', 'liters', 'amount_thb', 'payment_method',
    'points_earned', 'plate', 'staff_id', 'note'
  ],
  Redemptions: [
    'redemption_id', 'timestamp', 'member_id', 'reward_id',
    'reward_name', 'points_used', 'value_thb',
    'coupon_code', 'status', 'used_at', 'staff_id'
  ],
  Rewards: [
    'reward_id', 'name', 'points_cost', 'value_thb', 'active', 'description'
  ],
  Staff: [
    'staff_id', 'line_user_id', 'name', 'role', 'active'
  ],
  Config: ['key', 'value', 'note']
};

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SCHEMA).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const headers = SCHEMA[name];
    const first = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    const empty = first.every(v => v === '' || v === null);
    if (empty) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
  });

  seedRewards_();
  seedConfig_();
  SpreadsheetApp.getUi().alert('Setup complete. Check the Rewards and Config sheets, then deploy as Web App.');
}

function seedRewards_() {
  const sheet = getSheet_(SHEET_NAMES.REWARDS);
  if (sheet.getLastRow() > 1) return;
  const rows = [
    ['R001', 'ส่วนลดน้ำมัน 25 บาท', 1000, 25, true, 'แลกเป็นส่วนลดเงินสดที่ปั๊ม'],
    ['R002', 'ส่วนลดน้ำมัน 75 บาท', 2500, 75, true, 'แลกเป็นส่วนลดเงินสดที่ปั๊ม'],
    ['R003', 'ส่วนลดน้ำมัน 175 บาท', 5000, 175, true, 'แลกเป็นส่วนลดเงินสดที่ปั๊ม'],
    ['R004', 'น้ำดื่ม 1 ขวด', 200, 10, true, 'รับที่หน้าร้าน'],
    ['R005', 'กาแฟร้อน 1 แก้ว', 400, 20, true, 'รับที่หน้าร้าน']
  ];
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function seedConfig_() {
  const sheet = getSheet_(SHEET_NAMES.CONFIG);
  if (sheet.getLastRow() > 1) return;
  const rows = Object.keys(DEFAULT_CONFIG).map(k => [k, DEFAULT_CONFIG[k], '']);
  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
}

function getSheet_(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function findRowByColumn_(sheetName, columnName, value) {
  const sheet = getSheet_(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const col = headers.indexOf(columnName);
  if (col < 0) return null;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][col]) === String(value)) {
      return { rowIndex: i + 1, headers: headers, values: data[i] };
    }
  }
  return null;
}

function rowToObject_(headers, values) {
  const o = {};
  headers.forEach((h, i) => o[h] = values[i]);
  return o;
}

function objectToRow_(headers, obj) {
  return headers.map(h => obj[h] !== undefined ? obj[h] : '');
}

function appendRow_(sheetName, obj) {
  const sheet = getSheet_(sheetName);
  const headers = SCHEMA[sheetName];
  sheet.appendRow(objectToRow_(headers, obj));
}

function updateRowByColumn_(sheetName, columnName, value, updates) {
  const found = findRowByColumn_(sheetName, columnName, value);
  if (!found) return false;
  const sheet = getSheet_(sheetName);
  const headers = found.headers;
  const newValues = found.values.slice();
  Object.keys(updates).forEach(k => {
    const idx = headers.indexOf(k);
    if (idx >= 0) newValues[idx] = updates[k];
  });
  sheet.getRange(found.rowIndex, 1, 1, headers.length).setValues([newValues]);
  return true;
}

function listRows_(sheetName) {
  const sheet = getSheet_(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => rowToObject_(headers, row));
}
