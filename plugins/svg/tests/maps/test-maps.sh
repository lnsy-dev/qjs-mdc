#!/bin/bash

echo "Testing map renderer..."

# Test 1: Raw GeoJSON with CLI bounds
echo "Test 1: Raw GeoJSON with CLI bounds"
./generate-svg.js tests/maps/california.geojson \
  --nw-lat=38.0 --nw-lon=-123.0 \
  --se-lat=34.0 --se-lon=-118.0 \
  --width=800 --height=600 \
  > tests/temp/map-basic.svg
echo "✓ Generated tests/temp/map-basic.svg"

# Test 2: Config wrapper with icons
echo "Test 2: Config wrapper with icons"
./generate-svg.js tests/maps/california-config.json \
  > tests/temp/map-icons.svg
echo "✓ Generated tests/temp/map-icons.svg"

# Test 3: Externally styled map
echo "Test 3: Externally styled map"
./generate-svg.js tests/maps/california-config.json \
  --externally-styled \
  > tests/temp/map-styled.svg
echo "✓ Generated tests/temp/map-styled.svg"

# Test 4: Auto-detection (no --type flag)
echo "Test 4: Auto-detection"
./generate-svg.js tests/maps/california.geojson \
  --nw-lat=38.0 --nw-lon=-123.0 \
  --se-lat=34.0 --se-lon=-118.0 \
  > tests/temp/map-auto.svg
echo "✓ Generated tests/temp/map-auto.svg"

echo ""
echo "All map tests completed!"
echo "View results in tests/temp/"
