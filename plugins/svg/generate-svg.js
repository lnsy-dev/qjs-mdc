#!/usr/bin/env -S qjs -m
import * as std from "std";
import { parseArgs, readInput } from './src/cli.js';
import { validateInput, parseYAMLFrontMatter, applyFieldMappings, parseData, parseMapConfig, mergeConfig } from './src/utils/parsers.js';
import { createSVGContainer, closeSVGContainer } from './src/utils/svg.js';
import { generatePatternDefs } from './src/utils/patterns.js';
import { detectChartType, getRenderer } from './src/registry.js';
import { getBackgroundDimensions } from './src/renderers/map.js';

function main() {
  const options = parseArgs(scriptArgs);
  const rawData = readInput(options.dataArg);
  
  validateInput(rawData);
  
  const yamlResult = parseYAMLFrontMatter(rawData);
  let dataContent = rawData;
  let yamlConfig = {};
  
  if (yamlResult) {
    yamlConfig = yamlResult.config;
    dataContent = yamlResult.content;
  }
  
  let data = parseData(dataContent);
  const mapConfig = parseMapConfig(data);
  
  if (mapConfig) {
    data = mapConfig.geojson;
  }
  
  const config = mergeConfig(options, yamlConfig, mapConfig);
  
  // Use background SVG dimensions if available
  if (config.backgroundSvg) {
    const bgDims = getBackgroundDimensions(config.backgroundSvg);
    if (bgDims) {
      config.width = bgDims.width;
      config.height = bgDims.height;
    }
  }
  
  const mappedData = applyFieldMappings(data, yamlConfig);
  const chartType = config.type || detectChartType(mappedData);
  
  const renderer = getRenderer(chartType);
  
  const captionHeight = chartType === 'map' ? 150 : undefined;
  let svg = createSVGContainer(config.width, config.height, config.name, config.description, captionHeight);
  svg += generatePatternDefs();
  svg += renderer.render(mappedData, config.width, config.height, config);
  svg += closeSVGContainer();
  
  std.out.puts(svg);
}

main();
