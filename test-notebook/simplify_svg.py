import xml.etree.ElementTree as ET
import re

tree = ET.parse('socal-map.svg')
root = tree.getroot()

for elem in root.iter():
    if 'd' in elem.attrib:
        path = elem.attrib['d']
        coords = re.findall(r'-?\d+\.?\d*', path)
        rounded = [str(round(float(c), 1)) for c in coords]
        elem.attrib['d'] = re.sub(r'-?\d+\.?\d*', lambda m: rounded.pop(0), path)

tree.write('socal-map-simplified.svg', encoding='utf-8', xml_declaration=True)
print("Simplified SVG saved as socal-map-simplified.svg")
