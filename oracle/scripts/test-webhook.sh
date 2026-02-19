#!/bin/bash

# Test webhook script for Hyro Challenge Oracle

PORT=${1:-3000}
ENDPOINT="http://localhost:$PORT"

echo "🧪 Testing Hyro Challenge Oracle"
echo "================================="
echo ""

# Test 1: Health check
echo "1️⃣  Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$ENDPOINT/health")
if [ $? -eq 0 ]; then
    echo "✅ Health check passed"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo "❌ Health check failed"
    exit 1
fi
echo ""

# Test 2: List templates
echo "2️⃣  Testing templates endpoint..."
TEMPLATES_RESPONSE=$(curl -s "$ENDPOINT/templates")
if [ $? -eq 0 ]; then
    echo "✅ Templates endpoint working"
    echo "   Response: $TEMPLATES_RESPONSE"
else
    echo "❌ Templates endpoint failed"
fi
echo ""

# Test 3: List challenges
echo "3️⃣  Testing challenges endpoint..."
CHALLENGES_RESPONSE=$(curl -s "$ENDPOINT/challenges")
if [ $? -eq 0 ]; then
    echo "✅ Challenges endpoint working"
    echo "   Response: $CHALLENGES_RESPONSE"
else
    echo "❌ Challenges endpoint failed"
fi
echo ""

# Test 4: Send test webhook (if test-payload.json exists)
if [ -f "test-payload.json" ]; then
    echo "4️⃣  Testing webhook endpoint..."
    WEBHOOK_RESPONSE=$(curl -s -X POST "$ENDPOINT/webhook/challenge-update" \
        -H "Content-Type: application/json" \
        -d @test-payload.json)
    
    if [ $? -eq 0 ]; then
        echo "✅ Webhook endpoint accepting requests"
        echo "   Response: $WEBHOOK_RESPONSE"
    else
        echo "❌ Webhook endpoint failed"
    fi
else
    echo "4️⃣  Skipping webhook test (test-payload.json not found)"
fi
echo ""

echo "================================="
echo "✨ Testing complete!"

