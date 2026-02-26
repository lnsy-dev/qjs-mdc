#!/bin/bash
# Compilation script for generate-svg

set -e

echo "Compiling generate-svg with qjsc..."

# Check if qjsc is available
if ! command -v qjsc &> /dev/null; then
    echo "Error: qjsc not found. Please install QuickJS."
    exit 1
fi

# Check if QuickJS headers are available
QUICKJS_DIR="/tmp/quickjs-2021-03-27"
if [ ! -f "$QUICKJS_DIR/quickjs-libc.h" ]; then
    echo "QuickJS headers not found. Downloading..."
    cd /tmp
    wget -q https://bellard.org/quickjs/quickjs-2021-03-27.tar.xz
    tar xf quickjs-2021-03-27.tar.xz
    cd quickjs-2021-03-27
    echo "Building QuickJS library..."
    make libquickjs.a > /dev/null 2>&1
    cd - > /dev/null
fi

# Compile to C
echo "Generating C code..."
qjsc -e -m -o generate-svg.c generate-svg.js

# Compile to binary
echo "Compiling binary..."
gcc -I"$QUICKJS_DIR" generate-svg.c -o generate-svg "$QUICKJS_DIR/libquickjs.a" -lm -ldl -lpthread

# Strip debug symbols
echo "Stripping debug symbols..."
strip generate-svg

# Clean up intermediate file
rm -f generate-svg.c

echo "✓ Compilation successful!"
echo "✓ Binary created: ./generate-svg ($(du -h generate-svg | cut -f1))"
echo ""
echo "Test the binary:"
echo "  ./generate-svg --help"
echo "  echo '[{\"label\":\"A\",\"value\":10}]' | ./generate-svg > output.svg"
