#!/bin/bash
set -e

echo "Building test notebook..."
./mdc test-notebook --output test-website

echo ""
echo "Build complete! Output in test-website/"
echo ""
echo "Generated files:"
ls -lh test-website/
