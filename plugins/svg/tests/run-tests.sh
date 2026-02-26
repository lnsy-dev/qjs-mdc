#!/bin/bash
set -e

cd "$(dirname "$0")/.."
mkdir -p tests/temp

echo "Generating CSS template..."
./tests/generate-css.js > tests/temp/chart-styles.css

echo "Testing bar chart (vertical)..."
echo '[{"label":"Q1","value":45},{"label":"Q2","value":67},{"label":"Q3","value":52}]' | ./generate-svg.js > tests/temp/bar-vertical.svg

echo "Testing bar chart (horizontal)..."
echo '[{"label":"Q1","value":45},{"label":"Q2","value":67},{"label":"Q3","value":52}]' | ./generate-svg.js --orientation=horizontal > tests/temp/bar-horizontal.svg

echo "Testing scatter plot..."
echo '[{"x":1,"y":10,"c":"A"},{"x":2,"y":20,"c":"A"},{"x":3,"y":15,"c":"B"},{"x":4,"y":25,"c":"B"}]' | ./generate-svg.js --type=scatter > tests/temp/scatter.svg

echo "Testing line graph..."
echo '[{"x":1,"y":10,"c":"Series A"},{"x":2,"y":15,"c":"Series A"},{"x":3,"y":12,"c":"Series A"},{"x":1,"y":5,"c":"Series B"},{"x":2,"y":8,"c":"Series B"},{"x":3,"y":11,"c":"Series B"}]' | ./generate-svg.js --type=line > tests/temp/line.svg

echo "Testing donut chart..."
echo '[{"label":"A","value":30},{"label":"B","value":50},{"label":"C","value":20}]' | ./generate-svg.js --type=donut > tests/temp/donut.svg

echo "Testing heikin-ashi chart..."
echo '[{"date":"2025-12-08","open":182.64,"high":188,"low":182.4,"close":185.55},{"date":"2025-12-09","open":185.56,"high":185.72,"low":183.32,"close":184.97},{"date":"2025-12-10","open":184.5,"high":186.2,"low":183.1,"close":185.8}]' | ./generate-svg.js > tests/temp/heikin-ashi.svg

echo "Testing map chart..."
echo '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[-73.95,40.75]},"properties":{"name":"Central Park","type":"park"}},{"type":"Feature","geometry":{"type":"LineString","coordinates":[[-74.0,40.7],[-73.9,40.8]]},"properties":{"name":"Broadway"}}]}' | ./generate-svg.js --nw-lat=40.8 --nw-lon=-74.0 --se-lat=40.7 --se-lon=-73.9 > tests/temp/map.svg

echo "Testing externally styled charts..."
echo '[{"label":"Q1","value":45},{"label":"Q2","value":67}]' | ./generate-svg.js --externally-styled > tests/temp/bar-styled.svg
echo '[{"x":1,"y":10,"c":"A"},{"x":2,"y":20,"c":"A"}]' | ./generate-svg.js --type=scatter --externally-styled > tests/temp/scatter-styled.svg
echo '[{"x":1,"y":10,"c":"Series A"},{"x":2,"y":15,"c":"Series A"}]' | ./generate-svg.js --type=line --externally-styled > tests/temp/line-styled.svg
echo '[{"label":"A","value":30},{"label":"B","value":50}]' | ./generate-svg.js --type=donut --externally-styled > tests/temp/donut-styled.svg
echo '[{"date":"2025-12-08","open":182.64,"high":188,"low":182.4,"close":185.55}]' | ./generate-svg.js --externally-styled > tests/temp/heikin-ashi-styled.svg

echo "All tests completed. SVG files generated in tests/temp/"
echo "CSS template generated at tests/temp/chart-styles.css"
