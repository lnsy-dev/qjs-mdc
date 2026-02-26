const SPACING = 4;
const STROKE_WIDTH = 1;

function diagonalPattern(id) {
  const size = SPACING * 2;
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="var(--pattern-fill, white)"/>
    <path d="M-1,1 l2,-2 M0,${size} l${size},-${size} M${size-1},${size+1} l2,-2" stroke="var(--pattern-stroke, black)" stroke-width="${STROKE_WIDTH}"/>
  </pattern>`;
}

function dotsPattern(id) {
  const size = SPACING * 2;
  const r = STROKE_WIDTH;
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="var(--pattern-fill, white)"/>
    <circle cx="${SPACING}" cy="${SPACING}" r="${r}" fill="var(--pattern-stroke, black)"/>
  </pattern>`;
}

function horizontalPattern(id) {
  const size = SPACING * 2;
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="var(--pattern-fill, white)"/>
    <line x1="0" y1="${SPACING}" x2="${size}" y2="${SPACING}" stroke="var(--pattern-stroke, black)" stroke-width="${STROKE_WIDTH}"/>
  </pattern>`;
}

function verticalPattern(id) {
  const size = SPACING * 2;
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="var(--pattern-fill, white)"/>
    <line x1="${SPACING}" y1="0" x2="${SPACING}" y2="${size}" stroke="var(--pattern-stroke, black)" stroke-width="${STROKE_WIDTH}"/>
  </pattern>`;
}

export function generatePatternDefs() {
  return `<defs>
  ${diagonalPattern('pattern-0')}
  ${dotsPattern('pattern-1')}
  ${horizontalPattern('pattern-2')}
  ${verticalPattern('pattern-3')}
</defs>
`;
}

export function getPattern(index) {
  return `url(#pattern-${index % 4})`;
}
