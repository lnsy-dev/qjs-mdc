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
