import { Plugin, MarkdownPostProcessorContext, TFile } from 'obsidian';
import { RENDERERS, getRenderer, detectChartType } from './registry';
import { parseYAMLFrontMatter, parseData, applyFieldMappings, parseMapConfig, createSVGContainer, closeSVGContainer, generatePatternDefs } from './utils';

async function findFileRecursive(plugin: Plugin, filename: string, startPath: string = ''): Promise<TFile | null> {
  const files = plugin.app.vault.getFiles();
  
  for (const file of files) {
    if (file.name === filename) {
      return file;
    }
  }
  
  return null;
}

async function loadVaultFile(plugin: Plugin, filePath: string, ctx: MarkdownPostProcessorContext): Promise<string> {
  // Get the file that contains this code block
  const sourceFile = plugin.app.vault.getAbstractFileByPath(ctx.sourcePath);
  
  if (!sourceFile || !(sourceFile instanceof TFile)) {
    throw new Error(`Cannot resolve source file: ${ctx.sourcePath}`);
  }
  
  let file: TFile | null = null;
  
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    // Resolve relative path
    const sourceDir = sourceFile.parent?.path || '';
    const resolvedPath = `${sourceDir}/${filePath}`.replace(/\/\.\//g, '/').replace(/\/[^/]+\/\.\.\//g, '/');
    const abstractFile = plugin.app.vault.getAbstractFileByPath(resolvedPath);
    file = abstractFile instanceof TFile ? abstractFile : null;
  } else {
    // Just a filename - search recursively
    file = await findFileRecursive(plugin, filePath);
  }
  
  if (!file) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  return await plugin.app.vault.read(file);
}

async function processChartBlock(
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  plugin: Plugin,
  chartType: string
): Promise<void> {
  try {
    // Parse YAML front matter if present
    const yamlResult = parseYAMLFrontMatter(source);
    let dataContent = source;
    let config: Record<string, any> = {};
    
    if (yamlResult) {
      config = yamlResult.config;
      dataContent = yamlResult.content;
    }
    
    // Set default dimensions
    const width = config.width || 600;
    const height = config.height || 400;
    
    // Parse data
    let data = parseData(dataContent);
    
    // Check for map config wrapper
    const mapConfig = parseMapConfig(data);
    if (mapConfig) {
      data = mapConfig.geojson;
      if (mapConfig.northWestBounds && !config.nwLat) {
        config.nwLat = mapConfig.northWestBounds[0];
        config.nwLon = mapConfig.northWestBounds[1];
      }
      if (mapConfig.southEastBounds && !config.seLat) {
        config.seLat = mapConfig.southEastBounds[0];
        config.seLon = mapConfig.southEastBounds[1];
      }
      if (mapConfig.iconList) config.iconList = mapConfig.iconList;
      if (mapConfig.backgroundSvg) config.backgroundSvg = mapConfig.backgroundSvg;
      if (mapConfig.name) config.name = mapConfig.name;
      if (mapConfig.description) config.description = mapConfig.description;
    }
    
    // Load background SVG if it's a file path
    if (config.backgroundSvg) {
      config.backgroundSvg = await loadVaultFile(plugin, config.backgroundSvg, ctx);
    }
    
    // Apply field mappings
    const mappedData = applyFieldMappings(data, config);
    
    // Detect chart type if not explicitly specified
    const type = config.type || chartType;
    const renderer = getRenderer(type);
    
    // Build options object
    const chartId = Math.floor(Math.random() * 1000000);
    const options = {
      width,
      height,
      orientation: config.orientation,
      externallyStyled: true,
      chartId,
      cssColors: null,
      nwLat: config.nwLat || null,
      nwLon: config.nwLon || null,
      seLat: config.seLat || null,
      seLon: config.seLon || null,
      iconList: config.iconList,
      backgroundSvg: config.backgroundSvg,
      name: config.name,
      description: config.description
    };
    
    // Generate SVG
    let svg = createSVGContainer(width, height, options.name, options.description);
    svg += generatePatternDefs(chartId);
    svg += renderer.render(mappedData, width, height, options);
    svg += closeSVGContainer();
    
    // Insert SVG into container
    el.innerHTML = svg;
    el.addClass('chart-container');
    
  } catch (e) {
    el.innerHTML = `<div class="chart-error" style="border: 2px solid #d00; padding: 10px; margin: 10px 0; background: #fee;">
      <strong>Error generating ${chartType} chart:</strong> ${(e as Error).message}
    </div>`;
  }
}

export function registerChartProcessors(plugin: Plugin): void {
  // Register processor for each chart type
  for (const [type, renderer] of Object.entries(RENDERERS)) {
    plugin.registerMarkdownCodeBlockProcessor(type, (source, el, ctx) => {
      processChartBlock(source, el, ctx, plugin, type);
    });
  }
}
