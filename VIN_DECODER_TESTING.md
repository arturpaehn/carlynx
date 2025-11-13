# VIN Decoder - Quick Testing Guide

## 🧪 How to Test

### Step 1: Start Development Server
```powershell
npm run dev
```

### Step 2: Navigate to Add Listing Page
- **Individual Users**: `http://localhost:3000/add-listing`
- **Dealers**: `http://localhost:3000/dealer/add-listing`

### Step 3: Test VIN Auto-Fill

#### Test Case 1: Honda Car
1. Enter VIN: `1HGBH41JXMN109186`
2. Click "Auto-fill from VIN" button
3. ✅ Should auto-fill:
   - Vehicle Type: Car
   - Brand: Honda
   - Model: Accord
   - Year: 1991
   - Transmission: Manual/Automatic
   - Fuel Type: Gasoline
   - Engine: ~2.2L

#### Test Case 2: Ford Truck
1. Enter VIN: `1FTFW1ET5DFC10312`
2. Click "Auto-fill from VIN" button
3. ✅ Should auto-fill:
   - Vehicle Type: Car
   - Brand: Ford
   - Model: F-150
   - Year: 2013
   - Transmission: Automatic
   - Fuel Type: Gasoline
   - Engine: ~5.0L

#### Test Case 3: Tesla Electric
1. Enter VIN: `5YJ3E1EA9JF000001`
2. Click "Auto-fill from VIN" button
3. ✅ Should auto-fill:
   - Vehicle Type: Car
   - Brand: Tesla
   - Model: Model 3
   - Year: 2018
   - Fuel Type: Electric
   - Engine: Electric motor

#### Test Case 4: Invalid VIN
1. Enter VIN: `12345678901234567` (invalid)
2. Click "Auto-fill from VIN" button
3. ✅ Should show error message

### Step 4: Verify Form Behavior
- [ ] VIN field is at the TOP of the form
- [ ] VIN field is in a blue highlighted box
- [ ] Hint text explains auto-fill feature
- [ ] Button is disabled when VIN is not 17 characters
- [ ] Loading spinner appears during decode
- [ ] Success message appears after successful decode
- [ ] Error message appears if decode fails
- [ ] Auto-filled values can be manually changed
- [ ] Form can be submitted with auto-filled data

### Step 5: Test in Spanish
1. Change language to Spanish (ES)
2. Repeat tests above
3. ✅ Verify all UI text is in Spanish

## 📱 Mobile Testing
- Test on mobile viewport (375px width)
- Verify VIN field is responsive
- Verify button text wraps properly
- Verify form layout adjusts

## 🎯 Success Criteria
✅ VIN field is prominently displayed at top
✅ Auto-fill button works for valid VINs
✅ All vehicle fields populate correctly
✅ Error handling works for invalid VINs
✅ UI is intuitive and clear in both languages
✅ Works on both individual and dealer forms
✅ Mobile responsive

## 🐛 Common Issues

### Issue: "Failed to decode VIN"
- **Cause**: Invalid VIN or API error
- **Solution**: Verify VIN is 17 characters and from US market

### Issue: Brand/Model not auto-filling
- **Cause**: Brand not in database
- **Solution**: Brand will still fill as text, manually complete other fields

### Issue: Button stays disabled
- **Cause**: VIN is not exactly 17 characters
- **Solution**: Ensure VIN is complete

## 📞 Support
For issues or questions, refer to:
- Main implementation doc: `VIN_DECODER_IMPLEMENTATION.md`
- NHTSA API docs: https://vpic.nhtsa.dot.gov/api/
