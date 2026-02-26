#!/bin/bash

echo "=== SVG Map Generator - Implementation Verification ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

pass=0
fail=0

check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $1"
    ((pass++))
  else
    echo -e "${RED}✗${NC} $1"
    ((fail++))
  fi
}

# Test 1: Raw GeoJSON with CLI bounds
echo "Test 1: Raw GeoJSON with CLI bounds"
./generate-svg.js tests/maps/california.geojson \
  --nw-lat=38.0 --nw-lon=-123.0 --se-lat=34.0 --se-lon=-118.0 \
  > /tmp/test1.svg 2>&1
check "Raw GeoJSON rendering"

# Test 2: Config wrapper auto-detection
echo "Test 2: Config wrapper auto-detection"
./generate-svg.js tests/maps/california-config.json > /tmp/test2.svg 2>&1
check "Config wrapper auto-detection"

# Test 3: Icon rendering
echo "Test 3: Icon rendering"
grep -q '<g transform="translate' /tmp/test2.svg
check "Custom icons embedded"

# Test 4: Data attributes
echo "Test 4: Data attributes"
grep -q 'data-name=' /tmp/test2.svg && \
grep -q 'data-geometry-type=' /tmp/test2.svg && \
grep -q 'data-lon=' /tmp/test2.svg
check "Data attributes present"

# Test 5: Map metadata
echo "Test 5: Map metadata"
grep -q 'data-name="California Cities"' /tmp/test2.svg && \
grep -q 'data-description=' /tmp/test2.svg
check "Map name and description"

# Test 6: All geometry types
echo "Test 6: All geometry types"
cat > /tmp/test-geom.json << 'GEOJSON'
{
  "type": "FeatureCollection",
  "features": [
    {"type": "Feature", "geometry": {"type": "Point", "coordinates": [-122, 37]}, "properties": {}},
    {"type": "Feature", "geometry": {"type": "LineString", "coordinates": [[-122, 37], [-121, 38]]}, "properties": {}},
    {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-122, 37], [-121, 37], [-121, 38], [-122, 38], [-122, 37]]]}, "properties": {}},
    {"type": "Feature", "geometry": {"type": "MultiPoint", "coordinates": [[-122, 37], [-121, 38]]}, "properties": {}},
    {"type": "Feature", "geometry": {"type": "MultiLineString", "coordinates": [[[-122, 37], [-121, 38]]]}, "properties": {}},
    {"type": "Feature", "geometry": {"type": "MultiPolygon", "coordinates": [[[[-122, 37], [-121, 37], [-121, 38], [-122, 38], [-122, 37]]]]}, "properties": {}}
  ]
}
GEOJSON
./generate-svg.js /tmp/test-geom.json --nw-lat=39 --nw-lon=-123 --se-lat=36 --se-lon=-120 > /tmp/test6.svg 2>&1
grep -q 'data-geometry-type="Point"' /tmp/test6.svg && \
grep -q 'data-geometry-type="LineString"' /tmp/test6.svg && \
grep -q 'data-geometry-type="Polygon"' /tmp/test6.svg && \
grep -q 'data-geometry-type="MultiPoint"' /tmp/test6.svg && \
grep -q 'data-geometry-type="MultiLineString"' /tmp/test6.svg && \
grep -q 'data-geometry-type="MultiPolygon"' /tmp/test6.svg
check "All geometry types supported"

# Test 7: External styling
echo "Test 7: External styling"
./generate-svg.js tests/maps/california.geojson \
  --nw-lat=38.0 --nw-lon=-123.0 --se-lat=34.0 --se-lon=-118.0 \
  --externally-styled > /tmp/test7.svg 2>&1
grep 'data-element' /tmp/test7.svg | head -1 | grep -qv 'fill="' && \
grep -q 'class="data-element' /tmp/test7.svg
check "External styling support"

# Test 8: Compiled binary
echo "Test 8: Compiled binary"
if [ -f ./generate-svg ]; then
  ./generate-svg tests/maps/california-config.json > /tmp/test8.svg 2>&1
  check "Compiled binary works"
else
  echo -e "${RED}✗${NC} Compiled binary not found (run 'make compile')"
  ((fail++))
fi

# Test 9: YAML front matter
echo "Test 9: YAML front matter"
cat > /tmp/test-yaml.md << 'YAML'
---
type: map
nwLat: 38.0
nwLon: -123.0
seLat: 34.0
seLon: -118.0
name: Test Map
---
{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[-122,37]},"properties":{"name":"Test"}}]}
YAML
./generate-svg.js /tmp/test-yaml.md > /tmp/test9.svg 2>&1
grep -q 'data-name="Test Map"' /tmp/test9.svg
check "YAML front matter support"

# Test 10: Pattern fills
echo "Test 10: Pattern fills"
grep -q 'url(#pattern-' /tmp/test1.svg
check "Pattern fills for polygons"

echo ""
echo "=== Results ==="
echo -e "${GREEN}Passed: $pass${NC}"
if [ $fail -gt 0 ]; then
  echo -e "${RED}Failed: $fail${NC}"
else
  echo "All tests passed! ✨"
fi

# Cleanup
rm -f /tmp/test*.svg /tmp/test*.json /tmp/test*.md

exit $fail
