#!/usr/bin/env -S qjs -m
import * as std from "std";
import { parseArgs, readInput } from './src/cli.js';
import { validateInput, parseYAMLFrontMatter, applyFieldMappings, parseData, isMapConfigWrapper, parseMapConfig } from './src/utils/parsers.js';
import { createSVGContainer, closeSVGContainer } from './src/utils/svg.js';
import { generatePatternDefs } from './src/utils/patterns.js';
import { detectChartType, getRenderer } from './src/registry.js';

function main() {
  const options = parseArgs(scriptArgs);
  const rawData = readInput(options.dataArg);
  
  validateInput(rawData);
  
  const yamlResult = parseYAMLFrontMatter(rawData);
  let dataContent = rawData;
  let config = {};
  
  if (yamlResult) {
    config = yamlResult.config;
    dataContent = yamlResult.content;
    
    if (config.width && !options.width) options.width = config.width;
    if (config.height && !options.height) options.height = config.height;
    if (config.type && !options.type) options.type = config.type;
    if (config.orientation && !options.orientation) options.orientation = config.orientation;
    if (config.nwLat && options.nwLat === null) options.nwLat = config.nwLat;
    if (config.nwLon && options.nwLon === null) options.nwLon = config.nwLon;
    if (config.seLat && options.seLat === null) options.seLat = config.seLat;
    if (config.seLon && options.seLon === null) options.seLon = config.seLon;
    if (config.iconList) options.iconList = config.iconList;
    if (config.backgroundSvg) options.backgroundSvg = config.backgroundSvg;
    if (config.name) options.name = config.name;
    if (config.description) options.description = config.description;
  }
  
  if (!options.width) options.width = 600;
  if (!options.height) options.height = 400;
  
  let data = parseData(dataContent);
  
  // Check for map config wrapper
  const mapConfig = parseMapConfig(data);
  if (mapConfig) {
    data = mapConfig.geojson;
    if (mapConfig.northWestBounds && options.nwLat === null) {
      options.nwLat = mapConfig.northWestBounds[0];
      options.nwLon = mapConfig.northWestBounds[1];
    }
    if (mapConfig.southEastBounds && options.seLat === null) {
      options.seLat = mapConfig.southEastBounds[0];
      options.seLon = mapConfig.southEastBounds[1];
    }
    if (mapConfig.iconList) options.iconList = mapConfig.iconList;
    if (mapConfig.backgroundSvg) options.backgroundSvg = mapConfig.backgroundSvg;
    if (mapConfig.name) options.name = mapConfig.name;
    if (mapConfig.description) options.description = mapConfig.description;
  }
  
  const mappedData = applyFieldMappings(data, config);
  const chartType = options.type || detectChartType(mappedData);
  
  const renderer = getRenderer(chartType);
  
  let svg = createSVGContainer(options.width, options.height, options.name, options.description);
  svg += generatePatternDefs();
  svg += renderer.render(mappedData, options.width, options.height, options);
  svg += closeSVGContainer();
  
  std.out.puts(svg);
}

main();
