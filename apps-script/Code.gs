// Web App entry. Route GET by ?p=<page> to serve LIFF HTML pages.
// Route POST: action=line_webhook for LINE; otherwise JSON-RPC style API.

function doGet(e) {
  const page = (e.parameter && e.parameter.p) || 'member';
  const allowed = ['register', 'member', 'staff', 'redeem', 'verify'];
  const file = allowed.includes(page) ? page : 'member';

  const tmpl = HtmlService.createTemplateFromFile(file);
  tmpl.liffId = getScriptProp_('LIFF_ID') || '';
  tmpl.scriptUrl = ScriptApp.getService().getUrl();
  tmpl.fuelTypes = getConfig('FUEL_TYPES') || '';
  return tmpl.evaluate()
    .setTitle('Reward System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doPost(e) {
  if (e.parameter && e.parameter.action === 'line_webhook') {
    return handleLineWebhook(e);
  }
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse_({ ok: false, error: 'invalid JSON' });
  }
  try {
    const result = routeApi_(body);
    return jsonResponse_({ ok: true, data: result });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message || String(err) });
  }
}

function routeApi_(body) {
  const action = body.action;
  switch (action) {
    case 'getMember': {
      const m = body.lineUserId
        ? findMemberByLineUserId(body.lineUserId)
        : findMemberByPhone(body.phone);
      if (!m) return null;
      return {
        member: m,
        transactions: listMemberTransactions(m.member_id, 10),
        redemptions: listMemberRedemptions(m.member_id, 10)
      };
    }
    case 'register':
      return registerMember(body);
    case 'updateMember':
      if (!body.memberId) throw new Error('missing memberId');
      return updateMember(body.memberId, body.updates || {});
    case 'recordTransaction':
      if (!isStaff_(body.staffLineUserId)) throw new Error('ไม่มีสิทธิ์เข้าถึง');
      return recordTransaction({
        memberId: body.memberId,
        phone: body.phone,
        amount: body.amount,
        liters: body.liters,
        fuelType: body.fuelType,
        paymentMethod: body.paymentMethod,
        plate: body.plate,
        staffId: body.staffLineUserId,
        note: body.note
      });
    case 'listRewards':
      return listActiveRewards();
    case 'redeem':
      return redeemReward({ memberId: body.memberId, rewardId: body.rewardId });
    case 'verifyCoupon':
      if (!isStaff_(body.staffLineUserId)) throw new Error('ไม่มีสิทธิ์เข้าถึง');
      return markCouponUsed(body.couponCode, body.staffLineUserId);
    case 'lookupMember':
      if (!isStaff_(body.staffLineUserId)) throw new Error('ไม่มีสิทธิ์เข้าถึง');
      return findMemberByPhone(body.phone);
    case 'getMemberQr':
      if (!body.lineUserId) throw new Error('missing lineUserId');
      {
        const m = findMemberByLineUserId(body.lineUserId);
        if (!m) throw new Error('ไม่พบสมาชิก');
        return {
          payload: generateMemberQrPayload(m.member_id),
          ttlSeconds: Number(getConfig('QR_TTL_SECONDS')) || 300
        };
      }
    case 'scanMemberQr':
      if (!isStaff_(body.staffLineUserId)) throw new Error('ไม่มีสิทธิ์เข้าถึง');
      return verifyMemberQrPayload(body.payload);
    case 'ping':
      return { time: now_() };
    default:
      throw new Error('unknown action: ' + action);
  }
}
