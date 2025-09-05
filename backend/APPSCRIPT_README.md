# Hướng dẫn tích hợp Google Forms qua App Script

## 1. Tạo Google Apps Script
- Truy cập [Google Apps Script](https://script.google.com/).
- Tạo project mới, dán code mẫu bên dưới vào file `Code.gs`.
- Triển khai dưới dạng web app (Deploy > New deployment > Web app):
  - Execute as: Me
  - Who has access: Anyone
- Lấy URL web app, dán vào biến môi trường `APPSCRIPT_URL` trong file `.env`.

## 2. Code mẫu App Script
```javascript
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  // Ví dụ: điền vào Google Sheet
  var sheet = SpreadsheetApp.openById('YOUR_SHEET_ID').getSheetByName('Orders');
  sheet.appendRow([
    data.orderCode,
    data.fullName,
    data.email,
    data.studentId,
    JSON.stringify(data.items),
    data.totalAmount,
    data.additionalNote,
    new Date()
  ]);
  return ContentService.createTextOutput('Success');
}
```
- Thay `YOUR_SHEET_ID` bằng ID Google Sheet của bạn.
- Sheet cần có các cột tương ứng.

## 3. Cấu hình backend
- Tạo file `.env` và thêm biến `APPSCRIPT_URL`.
- Đảm bảo đã cài package `axios` (`npm install axios`).
- Backend sẽ tự động gửi đơn hàng lên App Script khi tạo đơn hàng mới.
