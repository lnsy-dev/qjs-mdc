export function createProjection(nwBounds, seBounds, width, height) {
  const [nwLat, nwLon] = nwBounds;
  const [seLat, seLon] = seBounds;
  
  const lonRange = seLon - nwLon;
  const latRange = nwLat - seLat;
  
  return function project([lon, lat]) {
    const x = ((lon - nwLon) / lonRange) * width;
    const y = ((nwLat - lat) / latRange) * height;
    return [x, y];
  };
}

export function projectCoordinates(coords, type, projectFn) {
  if (type === 'Point') {
    return projectFn(coords);
  }
  
  if (type === 'LineString' || type === 'MultiPoint') {
    return coords.map(c => projectFn(c));
  }
  
  if (type === 'Polygon' || type === 'MultiLineString') {
    return coords.map(ring => ring.map(c => projectFn(c)));
  }
  
  if (type === 'MultiPolygon') {
    return coords.map(poly => poly.map(ring => ring.map(c => projectFn(c))));
  }
  
  return coords;
}

export function isPointInBounds([lon, lat], nwBounds, seBounds) {
  const [nwLat, nwLon] = nwBounds;
  const [seLat, seLon] = seBounds;
  return lon >= nwLon && lon <= seLon && lat >= seLat && lat <= nwLat;
}

export function clipLineSegment(p1, p2, nwBounds, seBounds) {
  const [nwLat, nwLon] = nwBounds;
  const [seLat, seLon] = seBounds;
  
  let [x1, y1] = p1;
  let [x2, y2] = p2;
  
  const INSIDE = 0, LEFT = 1, RIGHT = 2, BOTTOM = 4, TOP = 8;
  
  function computeCode(x, y) {
    let code = INSIDE;
    if (x < nwLon) code |= LEFT;
    else if (x > seLon) code |= RIGHT;
    if (y < seLat) code |= BOTTOM;
    else if (y > nwLat) code |= TOP;
    return code;
  }
  
  let code1 = computeCode(x1, y1);
  let code2 = computeCode(x2, y2);
  
  while (true) {
    if (!(code1 | code2)) return [[x1, y1], [x2, y2]];
    if (code1 & code2) return null;
    
    const codeOut = code1 || code2;
    let x, y;
    
    if (codeOut & TOP) {
      x = x1 + (x2 - x1) * (nwLat - y1) / (y2 - y1);
      y = nwLat;
    } else if (codeOut & BOTTOM) {
      x = x1 + (x2 - x1) * (seLat - y1) / (y2 - y1);
      y = seLat;
    } else if (codeOut & RIGHT) {
      y = y1 + (y2 - y1) * (seLon - x1) / (x2 - x1);
      x = seLon;
    } else {
      y = y1 + (y2 - y1) * (nwLon - x1) / (x2 - x1);
      x = nwLon;
    }
    
    if (codeOut === code1) {
      x1 = x; y1 = y;
      code1 = computeCode(x1, y1);
    } else {
      x2 = x; y2 = y;
      code2 = computeCode(x2, y2);
    }
  }
}

export function clipCoordinates(coords, type, nwBounds, seBounds) {
  if (type === 'Point') {
    return isPointInBounds(coords, nwBounds, seBounds) ? coords : null;
  }
  
  if (type === 'LineString') {
    const clipped = [];
    for (let i = 0; i < coords.length - 1; i++) {
      const segment = clipLineSegment(coords[i], coords[i + 1], nwBounds, seBounds);
      if (segment) {
        if (clipped.length === 0 || clipped[clipped.length - 1] !== segment[0]) {
          clipped.push(segment[0]);
        }
        clipped.push(segment[1]);
      }
    }
    return clipped.length > 0 ? clipped : null;
  }
  
  if (type === 'Polygon') {
    return coords.map(ring => {
      const clipped = clipCoordinates(ring, 'LineString', nwBounds, seBounds);
      return clipped || [];
    }).filter(ring => ring.length > 0);
  }
  
  return coords;
}
