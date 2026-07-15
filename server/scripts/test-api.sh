#!/usr/bin/env bash
# End-to-end curl smoke test for the Falsafah Tot API.
# Usage: BASE_URL=http://localhost:5000 bash scripts/test-api.sh
set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COOKIE_JAR="$(mktemp)"
PASS=0
FAIL=0

jget() { echo "$1" | node "$SCRIPT_DIR/json-get.js" "$2"; }

# check <label> <expected_status> <actual_status> [body]
check() {
  local label="$1" expected="$2" actual="$3" body="${4:-}"
  if [ "$expected" = "$actual" ]; then
    PASS=$((PASS + 1))
    printf "  PASS  %-55s [%s]\n" "$label" "$actual"
  else
    FAIL=$((FAIL + 1))
    printf "  FAIL  %-55s expected %s got %s\n" "$label" "$expected" "$actual"
    [ -n "$body" ] && printf "        body: %s\n" "$body"
  fi
}

# req <method> <path> [json-body] [bearer-token] -> sets $STATUS and $BODY, uses shared cookie jar
req() {
  local method="$1" path="$2" data="${3:-}" token="${4:-}"
  local args=(-s -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X "$method" -w "\n%{http_code}")
  [ -n "$data" ] && args+=(-H "Content-Type: application/json" -d "$data")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  local out
  out=$(curl "${args[@]}" "$BASE_URL$path")
  STATUS=$(echo "$out" | tail -n1)
  BODY=$(echo "$out" | sed '$d')
}

TS=$(date +%s)
UNIQUE_CNIC="3410$(printf '%09d' $((TS % 1000000000)))"

echo "=================================================================="
echo " Falsafah Tot API — curl smoke test against $BASE_URL"
echo "=================================================================="

echo; echo "-- Health --"
req GET /api/health
check "GET /api/health" 200 "$STATUS"

echo; echo "-- Auth: signin/OTP (buyer/seller/admin) --"
req POST /api/auth/signin '{"identifier":"buyer@falsafahtot.com","password":"password123"}'
check "POST /api/auth/signin (buyer)" 200 "$STATUS" "$BODY"
PENDING=$(jget "$BODY" pendingToken)

req POST /api/auth/otp/verify "{\"pendingToken\":\"$PENDING\",\"code\":\"000000\"}"
check "POST /api/auth/otp/verify (wrong code -> 400)" 400 "$STATUS" "$BODY"

req POST /api/auth/otp/verify "{\"pendingToken\":\"$PENDING\",\"code\":\"123456\"}"
check "POST /api/auth/otp/verify (buyer correct code)" 200 "$STATUS" "$BODY"
BUYER_TOKEN=$(jget "$BODY" token)

req POST /api/auth/signin '{"identifier":"seller@falsafahtot.com","password":"password123"}'
check "POST /api/auth/signin (seller)" 200 "$STATUS"
PENDING=$(jget "$BODY" pendingToken)
req POST /api/auth/otp/verify "{\"pendingToken\":\"$PENDING\",\"code\":\"123456\"}"
check "POST /api/auth/otp/verify (seller)" 200 "$STATUS" "$BODY"
SELLER_TOKEN=$(jget "$BODY" token)

req POST /api/auth/signin '{"identifier":"admin@falsafahtot.com","password":"password123"}'
check "POST /api/auth/signin (admin)" 200 "$STATUS"
PENDING=$(jget "$BODY" pendingToken)
req POST /api/auth/otp/verify "{\"pendingToken\":\"$PENDING\",\"code\":\"123456\"}"
check "POST /api/auth/otp/verify (admin)" 200 "$STATUS" "$BODY"
ADMIN_TOKEN=$(jget "$BODY" token)

req POST /api/auth/signin '{"identifier":"buyer@falsafahtot.com","password":"wrong-password"}'
check "POST /api/auth/signin (wrong password -> 401)" 401 "$STATUS"

echo; echo "-- Auth: signup (buyer / individual seller / corporate seller) --"
req POST /api/auth/signup "{\"role\":\"buyer\",\"companyName\":\"Test Buyer $TS\",\"country\":\"Pakistan\",\"phone\":\"+92 300 55$TS\",\"email\":\"buyer.$TS@example.com\",\"password\":\"password123\"}"
check "POST /api/auth/signup (new buyer)" 200 "$STATUS" "$BODY"
PENDING=$(jget "$BODY" pendingToken)
req POST /api/auth/otp/verify "{\"pendingToken\":\"$PENDING\",\"code\":\"123456\"}"
check "POST /api/auth/otp/verify (new buyer)" 200 "$STATUS" "$BODY"

req POST /api/auth/signup '{"role":"buyer","companyName":"Dup","country":"Pakistan","phone":"+92 300 0000002","email":"buyer@falsafahtot.com","password":"password123"}'
check "POST /api/auth/signup (duplicate email -> 409)" 409 "$STATUS"

req POST /api/auth/signup "{\"role\":\"seller\",\"sellerType\":\"individual\",\"companyName\":\"Test Individual Seller $TS\",\"country\":\"Pakistan\",\"phone\":\"+92 300 66$TS\",\"email\":\"seller.ind.$TS@example.com\",\"password\":\"password123\",\"category\":\"Sports Goods\",\"address\":\"Street 1, Sialkot\",\"cnicNumber\":\"$UNIQUE_CNIC\",\"cnicFront\":\"https://example.com/front.jpg\",\"cnicBack\":\"https://example.com/back.jpg\"}"
check "POST /api/auth/signup (individual seller)" 200 "$STATUS" "$BODY"

req POST /api/auth/signup "{\"role\":\"seller\",\"sellerType\":\"corporate\",\"companyName\":\"Test Corp Seller $TS\",\"country\":\"Pakistan\",\"phone\":\"+92 300 77$TS\",\"email\":\"seller.corp.$TS@example.com\",\"password\":\"password123\",\"category\":\"Textiles & Fabrics\",\"location\":\"Lahore\",\"businessAddress\":\"Industrial Area, Lahore\",\"businessDocument\":\"https://example.com/doc.pdf\",\"legalCompanyName\":\"Test Corp Seller Ltd\",\"registrationNumber\":\"REG-1\",\"ntn\":\"1234567-8\",\"companyEmail\":\"contact@testcorp.example.com\",\"companyPhone\":\"+92 42 1112233\",\"bankName\":\"HBL\",\"accountTitle\":\"Test Corp Seller\",\"accountNumber\":\"0123456789\",\"iban\":\"PK36HABB0001234567890123\"}"
check "POST /api/auth/signup (corporate seller)" 200 "$STATUS" "$BODY"

req POST /api/auth/signup '{"role":"seller","sellerType":"corporate","companyName":"Missing Fields Co","email":"missing.'"$TS"'@example.com","password":"password123"}'
check "POST /api/auth/signup (corporate missing fields -> 400)" 400 "$STATUS"

echo; echo "-- Auth: forgot password / reset --"
req POST /api/auth/forgot-password '{"identifier":"buyer@falsafahtot.com"}'
check "POST /api/auth/forgot-password" 200 "$STATUS" "$BODY"
PENDING=$(jget "$BODY" pendingToken)
req POST /api/auth/otp/verify "{\"pendingToken\":\"$PENDING\",\"code\":\"123456\"}"
check "POST /api/auth/otp/verify (reset purpose)" 200 "$STATUS" "$BODY"

echo; echo "-- Auth: session / profile / KYC resubmit / logout --"
req GET /api/auth/session "" "$BUYER_TOKEN"
check "GET /api/auth/session (authed)" 200 "$STATUS" "$BODY"
req GET /api/auth/session
check "GET /api/auth/session (no token -> 401)" 401 "$STATUS"

req PATCH /api/auth/profile '{"companyName":"Al-Karam Traders Updated","phone":"+92 300 0000000","country":"Pakistan","category":null}' "$BUYER_TOKEN"
check "PATCH /api/auth/profile" 200 "$STATUS" "$BODY"

req POST /api/auth/kyc/resubmit '{"cnicFront":"https://example.com/f2.jpg","cnicBack":"https://example.com/b2.jpg"}' "$SELLER_TOKEN"
check "POST /api/auth/kyc/resubmit (seller)" 200 "$STATUS" "$BODY"

req POST /api/auth/logout "" "$BUYER_TOKEN"
check "POST /api/auth/logout" 200 "$STATUS"

echo; echo "-- Catalog --"
req GET /api/categories
check "GET /api/categories" 200 "$STATUS"
req GET /api/categories/mobile
check "GET /api/categories/mobile" 200 "$STATUS"
req GET /api/mobile-tabs
check "GET /api/mobile-tabs" 200 "$STATUS"
req GET /api/products
check "GET /api/products" 200 "$STATUS"
req GET "/api/products?category=Textiles%20%26%20Fabrics"
check "GET /api/products?category=..." 200 "$STATUS"
req GET "/api/products?q=cotton"
check "GET /api/products?q=cotton" 200 "$STATUS"
req GET /api/products/trending
check "GET /api/products/trending" 200 "$STATUS"
req GET /api/products/cotton-twill-fabric
check "GET /api/products/:id" 200 "$STATUS" "$BODY"
req GET /api/products/does-not-exist
check "GET /api/products/:id (404)" 404 "$STATUS"
req GET /api/spotlight/near
check "GET /api/spotlight/near" 200 "$STATUS"
req GET /api/spotlight/trending
check "GET /api/spotlight/trending" 200 "$STATUS"

echo; echo "-- Cart (guest cookie) --"
req DELETE /api/cart
check "DELETE /api/cart (reset)" 200 "$STATUS"
req POST /api/cart/items '{"productId":"cotton-twill-fabric","qty":2}'
check "POST /api/cart/items" 200 "$STATUS" "$BODY"
req POST /api/cart/items '{"productId":"cotton-twill-fabric","qty":999999}'
check "POST /api/cart/items (exceeds stock -> 409)" 409 "$STATUS"
req PATCH /api/cart/items/cotton-twill-fabric '{"qty":5}'
check "PATCH /api/cart/items/:id" 200 "$STATUS" "$BODY"
req GET /api/cart
check "GET /api/cart (qty=5 persisted)" 200 "$STATUS" "$BODY"
req PATCH /api/cart/items/cotton-twill-fabric '{"qty":0}'
check "PATCH /api/cart/items/:id (qty=0 removes)" 200 "$STATUS"
req POST /api/cart/items '{"productId":"surgical-instrument-set","qty":1}'
check "POST /api/cart/items (second item)" 200 "$STATUS"
req DELETE /api/cart/items/surgical-instrument-set
check "DELETE /api/cart/items/:id" 200 "$STATUS"

echo; echo "-- Checkout --"
req DELETE /api/cart
req POST /api/checkout
check "POST /api/checkout (empty cart -> 400)" 400 "$STATUS"
req POST /api/cart/items '{"productId":"cotton-twill-fabric","qty":2}'
req POST /api/checkout
check "POST /api/checkout (with items)" 200 "$STATUS" "$BODY"

echo; echo "-- Sellers directory --"
req GET /api/sellers
check "GET /api/sellers" 200 "$STATUS" "$BODY"
SELLER_DIR_ID=$(jget "$BODY" "sellers" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const a=JSON.parse(d);console.log(a[0]._id)})")
req GET "/api/sellers/$SELLER_DIR_ID"
check "GET /api/sellers/:id" 200 "$STATUS"
req GET /api/sellers/000000000000000000000000
check "GET /api/sellers/:id (404)" 404 "$STATUS"
req GET "/api/sellers/$SELLER_DIR_ID/follow"
check "GET /api/sellers/:id/follow (status)" 200 "$STATUS"
req POST "/api/sellers/$SELLER_DIR_ID/follow"
check "POST /api/sellers/:id/follow" 200 "$STATUS" "$BODY"
req DELETE "/api/sellers/$SELLER_DIR_ID/follow"
check "DELETE /api/sellers/:id/follow" 200 "$STATUS" "$BODY"

echo; echo "-- Seller portal --"
req GET /api/seller/stats "" "$SELLER_TOKEN"
check "GET /api/seller/stats" 200 "$STATUS" "$BODY"
req GET /api/seller/stats "" "$BUYER_TOKEN"
check "GET /api/seller/stats (as buyer -> 403)" 403 "$STATUS"
req GET /api/seller/stats
check "GET /api/seller/stats (no token -> 401)" 401 "$STATUS"

req GET /api/seller/products "" "$SELLER_TOKEN"
check "GET /api/seller/products" 200 "$STATUS" "$BODY"

req POST /api/seller/products '{"name":"Curl Test Listing","category":"Textiles & Fabrics","price":500,"unit":"metre","moq":"100m","stock":1000,"status":"active","description":"created by curl smoke test","images":["https://example.com/p1.jpg"]}' "$SELLER_TOKEN"
check "POST /api/seller/products" 201 "$STATUS" "$BODY"
NEW_PRODUCT_ID=$(jget "$BODY" "product._id")

req GET "/api/seller/products/$NEW_PRODUCT_ID" "" "$SELLER_TOKEN"
check "GET /api/seller/products/:id" 200 "$STATUS"

req POST /api/seller/products '{"name":"Bad","category":"Textiles & Fabrics","price":-1,"unit":"metre","moq":"1m","stock":1}' "$SELLER_TOKEN"
check "POST /api/seller/products (invalid price -> 400)" 400 "$STATUS"

req PATCH "/api/seller/products/$NEW_PRODUCT_ID" '{"price":550,"stock":900}' "$SELLER_TOKEN"
check "PATCH /api/seller/products/:id" 200 "$STATUS" "$BODY"

req DELETE "/api/seller/products/$NEW_PRODUCT_ID" "" "$SELLER_TOKEN"
check "DELETE /api/seller/products/:id" 200 "$STATUS"

req GET /api/seller/orders "" "$SELLER_TOKEN"
check "GET /api/seller/orders" 200 "$STATUS" "$BODY"
ORDER_ID=$(jget "$BODY" "orders" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const a=JSON.parse(d);console.log(a[0]._id)})")

req PATCH "/api/seller/orders/$ORDER_ID" '{"status":"Processing"}' "$SELLER_TOKEN"
check "PATCH /api/seller/orders/:id" 200 "$STATUS" "$BODY"
req PATCH "/api/seller/orders/$ORDER_ID" '{"status":"NotAStatus"}' "$SELLER_TOKEN"
check "PATCH /api/seller/orders/:id (invalid status -> 404)" 404 "$STATUS"

echo; echo "-- Admin --"
req PATCH "/api/admin/sellers/$SELLER_DIR_ID/verify" '{"verified":true}' "$ADMIN_TOKEN"
check "PATCH /api/admin/sellers/:id/verify" 200 "$STATUS" "$BODY"
req PATCH "/api/admin/sellers/$SELLER_DIR_ID/verify" '{"verified":true}' "$SELLER_TOKEN"
check "PATCH /api/admin/sellers/:id/verify (as seller -> 403)" 403 "$STATUS"

req GET /api/admin/kyc "" "$ADMIN_TOKEN"
check "GET /api/admin/kyc" 200 "$STATUS" "$BODY"
KYC_USER_ID=$(jget "$BODY" "sellers" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const a=JSON.parse(d);console.log(a[0]._id)})")

req GET "/api/admin/kyc/$KYC_USER_ID" "" "$ADMIN_TOKEN"
check "GET /api/admin/kyc/:userId" 200 "$STATUS"

req PATCH "/api/admin/kyc/$KYC_USER_ID" '{"status":"rejected","rejectionReason":"Blurry CNIC image."}' "$ADMIN_TOKEN"
check "PATCH /api/admin/kyc/:userId (reject)" 200 "$STATUS" "$BODY"
req PATCH "/api/admin/kyc/$KYC_USER_ID" '{"status":"approved"}' "$ADMIN_TOKEN"
check "PATCH /api/admin/kyc/:userId (approve)" 200 "$STATUS"

echo; echo "-- Uploads --"
echo "smoke test file $TS" > /tmp/upload-test.jpg
UP_OUT=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/uploads/products" -F "file=@/tmp/upload-test.jpg")
UP_STATUS=$(echo "$UP_OUT" | tail -n1)
UP_BODY=$(echo "$UP_OUT" | sed '$d')
check "POST /api/uploads/products" 201 "$UP_STATUS" "$UP_BODY"
UP_URL=$(jget "$UP_BODY" url)
STATIC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$UP_URL")
check "GET $UP_URL (static serve)" 200 "$STATIC_STATUS"
BAD_UP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/uploads/bogus-type" -F "file=@/tmp/upload-test.jpg")
check "POST /api/uploads/bogus-type (invalid type -> 400)" 400 "$BAD_UP_STATUS"

echo
echo "=================================================================="
echo " Results: $PASS passed, $FAIL failed"
echo "=================================================================="
rm -f "$COOKIE_JAR"
[ "$FAIL" -eq 0 ]
