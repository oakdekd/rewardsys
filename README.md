# Fuel Station Reward System

ระบบสะสมแต้มสำหรับสถานีบริการน้ำมัน ใช้ **Google Apps Script + Google Sheets + LINE Official Account**

## คุณสมบัติ MVP

- ลูกค้าสมัครสมาชิกผ่าน LINE (ชื่อ + เบอร์) รับฟรี +50 pt
- ลูกค้าเปิด LINE OA เห็น Dynamic QR (อายุ 5 นาที) ให้พนักงานสแกน
- พนักงานบันทึกการเติม (ยอดเงิน + วิธีจ่าย) ระบบคำนวณแต้มและส่ง LINE แจ้งเตือนทันที
- ลูกค้าแลกแต้มเป็นส่วนลด/ของรางวัล รับรหัสคูปอง แสดงให้พนักงานตัดใช้

## สูตรแต้ม (แก้ในชีต Config ได้)

- ทุก 45 บาท = 10 pt (base)
- เงินสด × 1.20 / QR × 1.30 / บัตรเครดิต × 1.00
- แลกของรางวัล: 1,000 / 2,500 / 5,000 pt → ส่วนลด 25 / 75 / 175 บาท
- แต้มหมดอายุ 24 เดือนนับจากธุรกรรมล่าสุด

## ค่าใช้จ่ายต่อเดือน

| รายการ | ราคา |
|--------|------|
| Google Apps Script + Sheets | ฟรี |
| LINE OA Light Plan (5,000 push) | 200 บาท |
| Hosting / Domain | ไม่ต้อง |
| **รวม** | **~200 บาท/เดือน** |

## วิธีติดตั้ง

ดูคู่มือ step-by-step ที่ [docs/setup.md](docs/setup.md)

## โครงสร้างโปรเจกต์

```
apps-script/
├── appsscript.json       # Manifest
├── Code.gs               # HTTP entry (doGet/doPost) + API router
├── Config.gs             # Config defaults + getter
├── Sheets.gs             # Sheet schema + helpers (run setupSheets() once)
├── Members.gs            # Register, lookup, dynamic QR signing
├── Transactions.gs       # Record sale, calculate points
├── Redemptions.gs        # Redeem rewards, verify coupons
├── LineWebhook.gs        # LINE webhook + push messages
├── Utils.gs              # IDs, phone normalize, JSON, staff check
├── _shared.html          # Shared CSS + JS for LIFF pages
├── register.html         # LIFF: customer signup
├── member.html           # LIFF: home (points + dynamic QR + history)
├── redeem.html           # LIFF: reward menu + coupon
├── staff.html            # LIFF: record transaction (staff only)
└── verify.html           # LIFF: mark coupon used (staff only)

docs/
└── setup.md              # ขั้นตอน setup ตั้งแต่ศูนย์
```

## ขั้นตอนที่ต้องทำเอง

ขั้นตอนเหล่านี้ทำใน UI ไม่สามารถใส่ในโค้ดได้

1. สร้าง Google Sheet เปล่า
2. คัดลอกไฟล์ใน `apps-script/` ไปวางใน Apps Script editor ของ Sheet นั้น
3. Run `setupSheets()` ครั้งเดียว เพื่อสร้าง headers + seed data
4. สร้าง LINE OA + LINE Login Channel ที่ [LINE Developers](https://developers.line.biz/)
5. สร้าง LIFF App และเอา LIFF ID มาใส่ใน Script Properties
6. Deploy Apps Script เป็น Web App
7. เอา Web App URL ไปใส่เป็น Webhook ใน LINE OA
8. ตั้ง Rich Menu ใน LINE OA Manager

รายละเอียดทุกขั้นตอนอยู่ใน [docs/setup.md](docs/setup.md)

## License

MIT
