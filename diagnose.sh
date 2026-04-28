#!/bin/bash
# Quick diagnostic script for MUSE backend errors

BACKEND_URL="${BACKEND_URL:-https://muse-backend-q8aa.onrender.com}"

echo "🔍 MUSE Backend Diagnostics"
echo "════════════════════════════════════════"
echo ""

# Test 1: Health endpoint
echo "1️⃣  Testing /health endpoint..."
HEALTH=$(curl -s "$BACKEND_URL/health")
echo "Response: $HEALTH"
echo ""

# Test 2: Check available services
echo "2️⃣  Checking available services..."
if echo "$HEALTH" | grep -q '"bg_removal_available": true'; then
    echo "✅ Background removal: AVAILABLE"
else
    echo "❌ Background removal: NOT AVAILABLE"
    echo "   → Set API keys in Render environment variables"
fi

if echo "$HEALTH" | grep -q '"anthropic": true'; then
    echo "✅ Anthropic/Claude: AVAILABLE"
else
    echo "❌ Anthropic/Claude: NOT AVAILABLE"
fi

if echo "$HEALTH" | grep -q '"replicate": true'; then
    echo "✅ Replicate: AVAILABLE"
else
    echo "❌ Replicate: NOT AVAILABLE"
fi

echo ""
echo "3️⃣  Checking API details..."
echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"

echo ""
echo "════════════════════════════════════════"
echo ""
echo "📋 Next steps if services unavailable:"
echo "1. Go to Render Dashboard → muse-backend"
echo "2. Click 'Environment' tab"
echo "3. Add/update:"
echo "   - VITE_RNAI_API_KEY"
echo "   - REPLICATE_API_TOKEN"  
echo "   - HUGGINGFACE_API_TOKEN"
echo "4. Save and redeploy"
echo "5. Run this script again to verify"
