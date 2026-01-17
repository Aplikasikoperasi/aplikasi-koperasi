# 🧪 POST-CLEANUP TESTING GUIDE
**Purpose:** Verify all critical features work correctly after trigger cleanup  
**Status:** All critical triggers verified ACTIVE ✅

---

## ✅ PRE-TEST VERIFICATION COMPLETE

### Critical Triggers Status Check

| Feature | Trigger Name | Status | Timing | Event |
|---------|-------------|--------|--------|-------|
| **Customer Auth Creation** | `trigger_auto_create_customer_auth` | ✅ ACTIVE | BEFORE | INSERT |
| **Application Auto-approve** | `trigger_auto_approve_application` | ✅ ACTIVE | BEFORE | INSERT |
| **Generate Installments** | `trigger_01_generate_installments` | ✅ ACTIVE | AFTER | INSERT |
| **Apply First Installment** | `trigger_02_apply_first_installment_on_approval` | ✅ ACTIVE | AFTER | INSERT |
| **Update Installment (Payment)** | `trg_payment_update_installment_insert` | ✅ ACTIVE | AFTER | INSERT |
| **Recalculate on Payment** | `trigger_recalculate_installment_on_payment_insert` | ✅ ACTIVE | AFTER | INSERT |

**✅ All critical triggers are ACTIVE and ready for testing**

---

## 📊 CURRENT SYSTEM STATE

**Data Check (Last 7 Days):**
- Customers: 166 total, 1 recent
- Credit Applications: 181 total, 2 recent  
- Installments: 1,827 total, 827 recent
- Payments: 0 total (ready for first test)

**Database Health:**
- ✅ No errors in last hour
- ✅ All tables accessible
- ✅ No performance issues detected

---

## 🧪 TESTING CHECKLIST

### TEST 1: CREATE NEW CUSTOMER ✅
**Path:** `/customers` → "Tambah Nasabah Baru"

**What to Test:**
1. Fill customer form with valid data:
   - Full name
   - NIK (unique)
   - Phone number
   - Date of Birth
   - Address
2. Click "Simpan"

**Expected Behavior:**
- ✅ Customer created successfully
- ✅ Toast notification appears
- ✅ Customer appears in list
- ✅ Auto-authentication created (check: customer can login with NIK@customer.local)
- ✅ Credit score set to default (5.0)

**Trigger Chain Tested:**
```
BEFORE INSERT: trigger_auto_create_customer_auth
  → Creates auth.users entry
  → Sets user_id on customer
  → Creates profile entry
```

**Verification Query:**
```sql
SELECT 
  c.full_name,
  c.id_number,
  c.user_id,
  c.credit_score,
  c.created_at
FROM customers c
ORDER BY c.created_at DESC
LIMIT 1;
```

---

### TEST 2: CREATE CREDIT APPLICATION ✅
**Path:** `/applications` → "Tambah Pengajuan Kredit"

**What to Test:**
1. Select existing customer
2. Fill application form:
   - Amount: Rp 5,000,000
   - Tenor: 6 months
   - Purpose: "Testing"
   - Collateral description
3. Click "Simpan"

**Expected Behavior:**
- ✅ Application created successfully
- ✅ Status automatically set to "approved" (if owner/admin)
- ✅ Toast notification appears
- ✅ Application appears in list
- ✅ **Installments auto-generated (6 installments)**
- ✅ **First installment auto-paid if setting = "paid_upfront"**
- ✅ Member stats updated

**Trigger Chain Tested:**
```
BEFORE INSERT: trigger_auto_approve_application
  → Auto-approve if owner/admin

AFTER INSERT: trigger_01_generate_installments (SEQUENCE 1)
  → Creates N installments
  → Calculates monthly payment
  → Sets due dates

AFTER INSERT: trigger_02_apply_first_installment_on_approval (SEQUENCE 2)
  → Applies admin fee
  → Pays first installment if paid_upfront
  → Creates payment record
```

**Verification Queries:**
```sql
-- Check application
SELECT 
  application_number,
  status,
  amount_approved,
  tenor_months,
  admin_fee_amount,
  created_at
FROM credit_applications
ORDER BY created_at DESC
LIMIT 1;

-- Check installments generated (should be 6)
SELECT 
  installment_number,
  due_date,
  total_amount,
  paid_amount,
  status,
  principal_paid
FROM installments
WHERE application_id = (
  SELECT id FROM credit_applications ORDER BY created_at DESC LIMIT 1
)
ORDER BY installment_number;

-- Check if first installment auto-paid
SELECT 
  i.installment_number,
  i.status,
  i.paid_amount,
  i.total_amount,
  COUNT(p.id) as payment_count
FROM installments i
LEFT JOIN payments p ON p.installment_id = i.id
WHERE i.application_id = (
  SELECT id FROM credit_applications ORDER BY created_at DESC LIMIT 1
)
AND i.installment_number = 1
GROUP BY i.id, i.installment_number, i.status, i.paid_amount, i.total_amount;
```

---

### TEST 3: PROCESS PAYMENT ✅
**Path:** `/installments-and-payments` → Select unpaid installment → "Bayar Angsuran"

**What to Test:**
1. Find an unpaid installment (installment_number 2 or later if 1 was auto-paid)
2. Click "Bayar Angsuran"
3. Enter payment details:
   - Amount: Full amount or partial
   - Payment date: Today
   - Payment method: "Tunai"
   - Reference number: "TEST001"
4. Click "Simpan Pembayaran"

**Expected Behavior:**
- ✅ Payment created successfully
- ✅ Toast notification appears
- ✅ **Installment status updated** (partial/paid)
- ✅ **Installment paid_amount updated**
- ✅ **Penalty frozen if applicable**
- ✅ **Credit score recalculated**
- ✅ Payment appears in history

**Trigger Chain Tested:**
```
AFTER INSERT: trg_payment_update_installment_insert
  → Updates installment.paid_amount
  → Sets installment.status
  → Freezes penalty if principal paid

AFTER INSERT: trigger_recalculate_installment_on_payment_insert
  → Recalculates installment totals
  → Updates application status if all paid
  → Updates customer credit score
```

**Verification Queries:**
```sql
-- Check payment created
SELECT 
  p.amount,
  p.payment_date,
  p.payment_method,
  p.reference_number,
  p.created_at,
  i.installment_number
FROM payments p
JOIN installments i ON i.id = p.installment_id
ORDER BY p.created_at DESC
LIMIT 1;

-- Check installment updated
SELECT 
  installment_number,
  status,
  total_amount,
  paid_amount,
  frozen_penalty,
  principal_paid,
  paid_at
FROM installments
WHERE id = (
  SELECT installment_id FROM payments ORDER BY created_at DESC LIMIT 1
);

-- Check credit score updated
SELECT 
  c.full_name,
  c.credit_score,
  c.updated_at
FROM customers c
WHERE c.id = (
  SELECT ca.customer_id 
  FROM credit_applications ca
  WHERE ca.id = (
    SELECT i.application_id 
    FROM installments i
    WHERE i.id = (
      SELECT installment_id FROM payments ORDER BY created_at DESC LIMIT 1
    )
  )
);
```

---

### TEST 4: DELETE PAYMENT (ROLLBACK TEST) ⚠️
**Path:** `/payments` → Select payment → "Hapus"

**What to Test:**
1. Find the test payment created above
2. Click delete/trash icon
3. Confirm deletion

**Expected Behavior:**
- ✅ Payment deleted successfully
- ✅ **Installment paid_amount decreased**
- ✅ **Installment status reverted** (paid → partial or unpaid)
- ✅ **Principal_paid reverted if necessary**
- ✅ **Credit score recalculated**

**Trigger Chain Tested:**
```
AFTER DELETE: trg_payment_update_installment_delete
  → Decreases installment.paid_amount
  → Reverts installment.status

AFTER DELETE: trigger_recalculate_installment_on_payment_delete
  → Recalculates installment
  → Updates customer credit score
```

**Verification Query:**
```sql
-- Check installment reverted
SELECT 
  installment_number,
  status,
  total_amount,
  paid_amount,
  principal_paid
FROM installments
WHERE id = (
  SELECT installment_id FROM payments ORDER BY created_at DESC LIMIT 1
);
```

---

### TEST 5: CUSTOMER BLOCKING (AUTO-UNBLOCK) ✅
**Path:** Manual test via credit score manipulation

**What to Test:**
1. Manually set a customer's credit_score < 3.7:
   ```sql
   UPDATE customers 
   SET credit_score = 3.5 
   WHERE id = '<test_customer_id>';
   ```

2. Check if auto-blocked:
   ```sql
   SELECT * FROM blocked_customers WHERE customer_id = '<test_customer_id>';
   ```

3. Manually set credit_score > 3.7:
   ```sql
   UPDATE customers 
   SET credit_score = 4.0 
   WHERE id = '<test_customer_id>';
   ```

4. Check if auto-unblocked:
   ```sql
   SELECT * FROM blocked_customers WHERE customer_id = '<test_customer_id>';
   ```

**Expected Behavior:**
- ✅ Customer auto-blocked when score < 3.7
- ✅ Entry created in blocked_customers
- ✅ Customer auto-unblocked when score > 3.7
- ✅ Entry removed from blocked_customers

**Trigger Chain Tested:**
```
AFTER UPDATE: trigger_auto_block_low_credit_score
  → Blocks customer if score < 3.7

AFTER UPDATE: trigger_auto_unblock_on_credit_score
  → Unblocks customer if score > 3.7
```

---

## 🔍 EDGE CASE TESTING

### Test 6: First Installment Handling (Tenor 1-3 vs 4+)

**Scenario A: Tenor 1-3 months**
1. Create application with tenor = 2 months
2. Check: First installment due date should be NEXT MONTH
3. Setting "paid_upfront" should be IGNORED for tenor 1-3

**Scenario B: Tenor 4+ months**  
1. Create application with tenor = 6 months
2. Check: First installment due date respects app_settings
3. If paid_upfront, first installment auto-paid

**Verification:**
```sql
-- Check first installment due date
SELECT 
  ca.application_date,
  ca.tenor_months,
  i.installment_number,
  i.due_date,
  EXTRACT(MONTH FROM i.due_date) - EXTRACT(MONTH FROM ca.application_date) as months_diff
FROM credit_applications ca
JOIN installments i ON i.application_id = ca.id
WHERE ca.id = '<test_application_id>'
AND i.installment_number = 1;
```

---

## 📋 TESTING RESULT TEMPLATE

### Test Execution Log

| Test # | Feature | Status | Notes |
|--------|---------|--------|-------|
| 1 | Create Customer | ⏳ Pending | |
| 2 | Create Application | ⏳ Pending | |
| 3 | Process Payment | ⏳ Pending | |
| 4 | Delete Payment | ⏳ Pending | |
| 5 | Auto Block/Unblock | ⏳ Pending | |
| 6 | Edge Cases | ⏳ Pending | |

**Legend:**
- ⏳ Pending
- ✅ Passed
- ❌ Failed
- ⚠️ Warning

---

## 🚨 TROUBLESHOOTING

### If Test Fails:

1. **Check Database Logs:**
   ```sql
   SELECT * FROM postgres_logs 
   WHERE timestamp > NOW() - INTERVAL '10 minutes'
   AND event_message ILIKE '%error%'
   ORDER BY timestamp DESC;
   ```

2. **Check Trigger Execution:**
   ```sql
   SELECT 
     t.tgname,
     t.tgenabled,
     p.proname
   FROM pg_trigger t
   JOIN pg_proc p ON t.tgfoid = p.oid
   WHERE t.tgrelid = '<table_name>'::regclass
   AND t.tgname = '<trigger_name>';
   ```

3. **Verify RLS Policies:**
   - Make sure user has proper role (owner/admin)
   - Check if RLS policies allow the operation

4. **Check System Logs:**
   Navigate to Settings → System Logs to see recent operations

---

## ✅ SUCCESS CRITERIA

**All tests PASS if:**
- ✅ Customer creation works with auth
- ✅ Application creation generates installments
- ✅ First installment auto-paid when configured
- ✅ Payment processing updates installment correctly
- ✅ Credit score recalculates on payment
- ✅ Auto-blocking/unblocking works at threshold 3.7
- ✅ No database errors in logs
- ✅ No trigger failures

**If ALL tests pass:** Database cleanup was successful with no side effects ✅

---

**Testing Started:** ___________  
**Testing Completed:** ___________  
**Tested By:** ___________  
**Overall Result:** ⏳ Pending
