#!/bin/bash
echo "🚀 [EDS-FLAGSHIP] SIMULATING MULTI-DOMAIN CRITICAL BREACH..."
echo "--------------------------------------------------------"

# Sending High-Risk Payload: Max Crowd Density + Max Thermal Signature
curl -X POST http://localhost:8080/api/v1/convergence/evaluate \
-H "Content-Type: application/json" \
-d '{
  "assetId": "CORE-DATABASE-01",
  "sensorPayload": {
    "crowdDensity": 0.99,
    "thermalRisk": 0.95
  }
}'

echo -e "\n\n✅ TEST COMPLETE. VERIFY 'IMMEDIATE_LOCKDOWN' STATUS ABOVE."
