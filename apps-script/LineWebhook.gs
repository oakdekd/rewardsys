// Receives webhook events from LINE. Validates signature, then handles
// follow/unfollow/message events. Push notifications are sent via
// notifyMemberPointsEarned_ and notifyMemberRedemption_.

function handleLineWebhook(e) {
  const body = e.postData.contents;
  const signature = e.parameter && e.parameter['x-line-signature'];
  if (!verifyLineSignature_(body, signature)) {
    return jsonResponse_({ ok: false, error: 'invalid signature' });
  }
  const payload = JSON.parse(body);
  (payload.events || []).forEach(handleLineEvent_);
  return jsonResponse_({ ok: true });
}

function handleLineEvent_(event) {
  try {
    if (event.type === 'follow') {
      replyText_(event.replyToken,
        'ยินดีต้อนรับสู่สมาชิกของเรา 🎉\n' +
        'กดเมนู "สมัครสมาชิก" เพื่อเริ่มสะสมแต้ม');
    } else if (event.type === 'message' && event.message.type === 'text') {
      handleTextMessage_(event);
    }
  } catch (err) {
    console.error('handleLineEvent error', err);
  }
}

function handleTextMessage_(event) {
  const text = (event.message.text || '').trim();
  const userId = event.source.userId;

  if (/^(เช็คแต้ม|แต้ม|points?)$/i.test(text)) {
    const member = findMemberByLineUserId(userId);
    if (!member) {
      replyText_(event.replyToken, 'ยังไม่พบข้อมูลสมาชิก กรุณาสมัครสมาชิกผ่านเมนูก่อน');
      return;
    }
    replyText_(event.replyToken,
      `แต้มสะสมของคุณ ${member.name}\n` +
      `ปัจจุบัน: ${member.points_balance} pt\n` +
      `สะสมรวม: ${member.lifetime_points} pt`);
  } else if (/^(เมนู|menu|help)$/i.test(text)) {
    replyText_(event.replyToken,
      'คำสั่ง:\n' +
      '• พิมพ์ "แต้ม" เพื่อเช็คแต้ม\n' +
      '• กดเมนูด้านล่างเพื่อแลกของรางวัล / สมัครสมาชิก');
  }
}

function verifyLineSignature_(body, signature) {
  const secret = getScriptProp_('LINE_CHANNEL_SECRET');
  if (!secret) {
    console.warn('LINE_CHANNEL_SECRET not set; skipping signature check (dev only)');
    return true;
  }
  if (!signature) return false;
  const hmac = Utilities.computeHmacSha256Signature(body, secret);
  const expected = Utilities.base64Encode(hmac);
  return expected === signature;
}

function replyText_(replyToken, text) {
  const token = getScriptProp_('LINE_CHANNEL_ACCESS_TOKEN');
  if (!token) return;
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({
      replyToken: replyToken,
      messages: [{ type: 'text', text: text }]
    }),
    muteHttpExceptions: true
  });
}

function pushText_(userId, text) {
  const token = getScriptProp_('LINE_CHANNEL_ACCESS_TOKEN');
  if (!token || !userId) return;
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({
      to: userId,
      messages: [{ type: 'text', text: text }]
    }),
    muteHttpExceptions: true
  });
}

function notifyMemberPointsEarned_(member, txn, newBalance) {
  if (!member.line_user_id) return;
  pushText_(member.line_user_id,
    `✅ บันทึกการเติมน้ำมันแล้ว\n` +
    `ยอด ${Number(txn.amount_thb).toLocaleString()} บาท\n` +
    `ได้รับ +${txn.points_earned} pt\n` +
    `แต้มคงเหลือ: ${newBalance} pt\n` +
    `ขอบคุณที่ใช้บริการครับ 🙏`);
}

function notifyMemberWelcome_(member, bonus) {
  if (!member.line_user_id) return;
  pushText_(member.line_user_id,
    `🎉 ยินดีต้อนรับ ${member.name}\n` +
    `สมัครสมาชิกสำเร็จ ได้รับโบนัสต้อนรับ +${bonus} pt\n\n` +
    `วิธีสะสมแต้ม:\n` +
    `1. กดเมนู "QR ของฉัน" ทุกครั้งที่เติมน้ำมัน\n` +
    `2. ให้พนักงานสแกน → แต้มเข้าทันที\n\n` +
    `ขอบคุณที่เป็นสมาชิกกับเราครับ 🙏`);
}

function notifyMemberRedemption_(member, coupon) {
  if (!member.line_user_id) return;
  pushText_(member.line_user_id,
    `🎁 แลกของรางวัลสำเร็จ\n` +
    `${coupon.reward_name}\n` +
    `รหัสคูปอง: ${coupon.coupon_code}\n` +
    `แสดงรหัสนี้ให้พนักงานก่อนใช้งาน\n` +
    `(ใช้ได้ครั้งเดียว)`);
}
