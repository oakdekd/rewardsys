# คู่มือติดตั้ง Reward System

ใช้เวลาประมาณ 30-45 นาที สำหรับครั้งแรก

## สิ่งที่ต้องเตรียม

- บัญชี Google (สำหรับ Sheets + Apps Script)
- เบอร์มือถือ (สำหรับสมัคร LINE Official Account)
- มือถือสำหรับทดสอบ (พร้อมแอป LINE)

---

## ส่วนที่ 1: ตั้งค่า Google Sheet + Apps Script

### 1.1 สร้าง Spreadsheet

1. เปิด [sheets.google.com](https://sheets.google.com)
2. กด **+ ว่าง** เพื่อสร้าง spreadsheet ใหม่
3. ตั้งชื่อ "Fuel Reward System" (หรือชื่ออื่นตามชอบ)

### 1.2 เปิด Apps Script Editor

1. ในชีตที่สร้าง กดเมนู **Extensions → Apps Script**
2. จะเปิด Apps Script editor ในแท็บใหม่
3. ลบไฟล์ `Code.gs` ที่มีอยู่เริ่มต้น (กดจุดสามจุด → Delete)

### 1.3 คัดลอกไฟล์โค้ด

จากโฟลเดอร์ `apps-script/` ในโปรเจกต์นี้ ให้สร้างไฟล์ในแต่ละชื่อใน Apps Script editor และคัดลอกเนื้อหา:

**ไฟล์ .gs (กด + → Script):**
- `Code.gs`
- `Config.gs`
- `Sheets.gs`
- `Members.gs`
- `Transactions.gs`
- `Redemptions.gs`
- `LineWebhook.gs`
- `Utils.gs`

**ไฟล์ .html (กด + → HTML):**
- `_shared.html`
- `register.html`
- `member.html`
- `redeem.html`
- `staff.html`
- `verify.html`

**ไฟล์ manifest:**
- ในเมนูซ้าย กด ⚙️ **Project Settings**
- ติ๊ก **Show "appsscript.json" manifest file**
- กลับไปที่ Editor → คลิก `appsscript.json` → แทนเนื้อหาด้วย `apps-script/appsscript.json`

### 1.4 รัน setupSheets() ครั้งแรก

1. ใน Apps Script editor เลือกฟังก์ชัน **setupSheets** จาก dropdown
2. กด **Run**
3. อนุญาตสิทธิ์ที่ Google ขอ (Advanced → Go to project → Allow)
4. กลับไปดู Spreadsheet จะเห็น 6 ชีตใหม่: Members, Transactions, Redemptions, Rewards, Staff, Config

---

## ส่วนที่ 2: สร้าง LINE Official Account

### 2.1 สมัคร LINE OA

1. ไปที่ [LINE Official Account Manager](https://manager.line.biz/)
2. ล็อกอินด้วย LINE account
3. กด **สร้างบัญชี** → เลือก **บัญชีทั่วไป**
4. กรอกข้อมูลร้าน → ตกลง
5. **เลือก plan**: เริ่มที่ Free ก่อน, ค่อย upgrade เป็น Light (200฿/เดือน) เมื่อมีลูกค้า > 30 คน

### 2.2 เปิด Messaging API

1. ในหน้า OA ที่สร้าง → ไปที่ **Settings → Messaging API**
2. กด **Enable Messaging API**
3. เลือก provider (สร้างใหม่ได้): ตั้งชื่อบริษัท/ร้าน
4. หลัง enable เสร็จ จะมี **Channel ID** และ **Channel Secret** ปรากฏ

### 2.3 จดค่าที่ต้องใช้

จากหน้า LINE Developers Console ([developers.line.biz](https://developers.line.biz/console/)):

ไปที่ provider → channel ของคุณ → tab **Messaging API**:
- **Channel Secret** (ใต้ Basic settings)
- **Channel Access Token (long-lived)** — กดปุ่ม Issue/Reissue เพื่อสร้าง

---

## ส่วนที่ 3: สร้าง LIFF App

### 3.1 สร้าง LINE Login Channel

LIFF ต้องอาศัย LINE Login Channel (ต่างจาก Messaging API Channel)

1. ใน [LINE Developers Console](https://developers.line.biz/console/) → provider เดิม
2. กด **Create a new channel** → เลือก **LINE Login**
3. กรอก:
   - Channel name: เช่น "Reward App"
   - App types: ✅ Web app
4. สร้างเสร็จ → tab **Basic settings** → จด **Channel ID**

### 3.2 สร้าง LIFF App

1. ในหน้า LINE Login Channel → tab **LIFF**
2. กด **Add**
3. กรอก:
   - LIFF app name: `Reward`
   - Size: **Full**
   - Endpoint URL: ใส่ placeholder ก่อน เช่น `https://example.com` (เปลี่ยนทีหลัง)
   - Scopes: ✅ `profile` ✅ `openid`
   - Bot link feature: **On (Aggressive)**
4. สร้างเสร็จ → จด **LIFF ID** (รูปแบบ `1234567890-AbCdEf`)

---

## ส่วนที่ 4: Deploy Apps Script เป็น Web App

### 4.1 ใส่ Script Properties

1. ใน Apps Script editor → ⚙️ **Project Settings**
2. เลื่อนลงไปที่ **Script Properties** → กด **Add script property**
3. เพิ่ม 4 keys:

| Key | Value |
|-----|-------|
| `LINE_CHANNEL_SECRET` | (จากส่วน 2.3) |
| `LINE_CHANNEL_ACCESS_TOKEN` | (จากส่วน 2.3) |
| `LIFF_ID` | (จากส่วน 3.2) |
| `QR_HMAC_SECRET` | สุ่มตัวอักษร 32 ตัว เช่น openssl rand -hex 16 |

> สำหรับ `QR_HMAC_SECRET` ให้สุ่มเอง อย่าใช้ค่าตัวอย่าง — ค่านี้ใช้เซ็น QR

### 4.2 Deploy เป็น Web App

1. ใน Apps Script editor มุมขวาบน กด **Deploy → New deployment**
2. กดเฟือง → เลือก **Web app**
3. ตั้งค่า:
   - Description: `v1`
   - Execute as: **Me (อีเมลของคุณ)**
   - Who has access: **Anyone**
4. กด **Deploy**
5. คัดลอก **Web app URL** ที่ได้ — รูปแบบ `https://script.google.com/macros/s/AKfy.../exec`

### 4.3 อัปเดต LIFF Endpoint

กลับไปที่ LIFF App ที่สร้างในส่วน 3.2:
1. แก้ **Endpoint URL** เป็น Web app URL ที่ได้ตามด้วย `?p=member`
2. เช่น `https://script.google.com/macros/s/AKfy.../exec?p=member`

---

## ส่วนที่ 5: ตั้งค่า Webhook ที่ LINE OA

1. กลับไปที่ Messaging API Channel ใน LINE Developers Console
2. tab **Messaging API** → **Webhook settings**
3. **Webhook URL**: ใส่ Web app URL + `?action=line_webhook`
   - เช่น `https://script.google.com/macros/s/AKfy.../exec?action=line_webhook`
4. กด **Verify** → ควรขึ้น Success
5. เปิด **Use webhook** = ON
6. ปิด **Auto-reply messages** = OFF (เราจะตอบเอง)
7. ปิด **Greeting messages** = OFF (เราจะส่งเอง)

---

## ส่วนที่ 6: เพิ่มพนักงาน

1. เปิด Spreadsheet → ชีต **Staff**
2. แต่ละพนักงานเปิดลิงก์ LIFF (เช่น `<liff-url>?p=staff`) ใน LINE → ระบบจะแจ้งว่ายังไม่มีสิทธิ์
3. ให้พนักงานส่ง LINE user ID มา (วิธีง่าย: ใช้บอท [linecorp/line-bot-sdk-utils](https://uxmilk.jp/?p=46100) หรือทำหน้า `?p=whoami` เพิ่มภายหลัง)
4. กรอกในชีต Staff:

| staff_id | line_user_id | name | role | active |
|----------|--------------|------|------|--------|
| S001 | Uxxxxxxxxxxxxxxxxxxxxxxxxx | สมชาย | cashier | TRUE |

> ตอนนี้ยังไม่มีหน้าโชว์ user ID อัตโนมัติ — เป็นข้อต้องเพิ่มใน v2

---

## ส่วนที่ 7: ตั้ง Rich Menu

ใน LINE OA Manager → **Home → Rich Menu**

1. กด **Create**
2. เลือก template 6 ปุ่ม (หรือ 4)
3. ใส่รูป template (ทำใน Canva หรือใช้ template สำเร็จรูป)
4. ตั้งค่าแต่ละปุ่ม:

| ปุ่ม | Action | URL |
|------|--------|-----|
| QR ของฉัน | Link | `<liff-url>?p=member` |
| สมัครสมาชิก | Link | `<liff-url>?p=register` |
| แลกของรางวัล | Link | `<liff-url>?p=redeem` |
| ติดต่อร้าน | Text | `ติดต่อเรา` |
| (พนักงาน) บันทึก | Link | `<liff-url>?p=staff` |
| (พนักงาน) ตรวจคูปอง | Link | `<liff-url>?p=verify` |

> `<liff-url>` คือ `https://liff.line.me/<LIFF_ID>` ใช้ลิงก์นี้แทน Web App URL เพื่อให้ liff.scanCodeV2 ทำงาน

5. กด **Save and publish**

**Tip**: ทำ Rich Menu แยก 2 ชุด — ปกติ vs พนักงาน ใช้ API ผูก rich menu กับ userId พนักงาน หรือทำ menu เดียวมีปุ่มพนักงานแล้วเช็ค role ในแอป

---

## ส่วนที่ 8: ทดสอบ

### ทดสอบเป็นลูกค้า
1. สแกน QR เพิ่มเพื่อน LINE OA ของร้าน (ดู QR ใน OA Manager)
2. กดเมนู **สมัครสมาชิก**
3. กรอกชื่อ + เบอร์ → กดสมัคร
4. ควรได้รับข้อความ welcome + 50 pt
5. กดเมนู **QR ของฉัน** → ควรเห็น QR

### ทดสอบเป็นพนักงาน
1. เพิ่ม userId ตัวเองในชีต Staff ก่อน
2. กดเมนู **บันทึก** ใน LINE
3. กดปุ่ม **สแกน QR** → สแกน QR ลูกค้าจากมือถืออีกเครื่อง
4. กรอกยอด 500 บาท → เลือก QR → กดบันทึก
5. ลูกค้าควรได้รับ push notification ทันที

---

## การปรับแต่งหลังติดตั้ง

### แก้สูตรแต้ม
เปิดชีต **Config** → แก้ค่าได้เลย (cache 5 นาที)

| key | default | คำอธิบาย |
|-----|---------|---------|
| EARN_THB_PER_UNIT | 45 | บาทต่อ 1 หน่วยคำนวณ |
| EARN_POINTS_PER_UNIT | 10 | แต้มต่อ 1 หน่วยคำนวณ |
| BONUS_CASH | 1.20 | คูณแต้มถ้าจ่ายเงินสด |
| BONUS_QR | 1.30 | คูณแต้มถ้าจ่าย QR |
| BONUS_CREDIT | 1.00 | คูณแต้มถ้าจ่ายบัตร |
| WELCOME_BONUS_POINTS | 50 | แต้มต้อนรับ |
| QR_TTL_SECONDS | 300 | อายุ QR (วินาที) |

### แก้รายการของรางวัล
เปิดชีต **Rewards** → เพิ่ม/แก้/ปิด (active = FALSE) แถวได้เลย

### Deploy เวอร์ชั่นใหม่
เมื่อแก้โค้ด: **Deploy → Manage deployments → ✏️ → New version → Deploy**

> สำคัญ: URL Web App **ไม่เปลี่ยน** ถ้าเลือก "Manage deployments → ✏️" (ถ้ากด New deployment URL จะเปลี่ยน → ต้องไปแก้ Webhook และ LIFF Endpoint ใหม่)

---

## Troubleshooting

| ปัญหา | แก้ |
|------|-----|
| สแกน QR ไม่ขึ้น | เปิดผ่าน LIFF URL (`liff.line.me/...`) ไม่ใช่ Web App URL |
| Webhook verify failed | เช็คว่าใส่ `?action=line_webhook` ใน Webhook URL แล้ว |
| ไม่ได้รับ push | LINE OA plan ฟรีจำกัด 200 ข้อความ/เดือน upgrade Light |
| `ลายเซ็น QR ไม่ตรง` | Script Property `QR_HMAC_SECRET` ไม่ตรงกับตอน sign |
| `ไม่มีสิทธิ์เข้าถึง` ตอนเป็นพนักงาน | เพิ่ม line_user_id ในชีต Staff + active = TRUE |
| ลูกค้าเปลี่ยนเบอร์ | แก้ในชีต Members ตรงๆ (อย่าลืม phone ต้องไม่ซ้ำ) |

---

## ขั้นต่อไป (Roadmap)

- [ ] หน้า `?p=whoami` ให้พนักงานดู userId ตัวเอง
- [ ] Auto-create pending member จากฝั่งพนักงาน (ถ้าลูกค้ายังไม่สมัคร)
- [ ] Dashboard ดูยอดขาย/แต้มคงค้าง/top customers
- [ ] Birthday auto bonus
- [ ] Broadcast แคมเปญแบ่ง segment
- [ ] OCR สลิป QR PromptPay (ใช้ Google Cloud Vision)
- [ ] เก็บข้อมูลทะเบียนรถ / ชนิดน้ำมัน เพิ่มเติม
