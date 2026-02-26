.PHONY: all compile test clean

all: compile

compile:
	@./compile.sh

test: compile
	@echo "Running tests..."
	@echo "Test 1: Bar chart from JSON file"
	./generate-svg charts/data.json > /tmp/test-bar.svg
	@echo "✓ Bar chart generated"
	
	@echo "Test 2: Scatter plot from stdin"
	@echo '[{"x":1,"y":10},{"x":2,"y":20}]' | ./generate-svg --type=scatter > /tmp/test-scatter.svg
	@echo "✓ Scatter plot generated"
	
	@echo "Test 3: Line graph with categories"
	@echo '[{"x":1,"y":10,"c":"A"},{"x":2,"y":15,"c":"A"}]' | ./generate-svg > /tmp/test-line.svg
	@echo "✓ Line graph generated"
	
	@echo "Test 4: Donut chart from string"
	./generate-svg '[{"label":"A","value":30},{"label":"B","value":50}]' --type=donut > /tmp/test-donut.svg
	@echo "✓ Donut chart generated"
	
	@echo "Test 5: CSV parsing"
	@echo 'label,value\nA,10\nB,20' | ./generate-svg > /tmp/test-csv.svg
	@echo "✓ CSV chart generated"
	
	@echo ""
	@echo "All tests passed! ✓"

clean:
	rm -f generate-svg
	@echo "✓ Cleaned compiled binary"
