#!/usr/bin/env python3
import sys
import os

def simplify_with_scour(input_file, output_file):
    try:
        from scour import scour
        with open(input_file, 'r') as f:
            input_svg = f.read()
        options = scour.sanitizeOptions()
        options.enable_viewboxing = True
        options.strip_ids = True
        options.strip_comments = True
        options.remove_metadata = True
        options.shorten_ids = True
        options.simple_colors = True
        output_svg = scour.scourString(input_svg, options)
        with open(output_file, 'w') as f:
            f.write(output_svg)
        return True
    except ImportError:
        print("Warning: scour not installed")
        return False

def simplify_paths_rdp(input_file, output_file, epsilon=1.0):
    try:
        import xml.etree.ElementTree as ET
        from simplification.cutil import simplify_coords
        import re
        
        tree = ET.parse(input_file)
        root = tree.getroot()
        
        for elem in root.iter():
            if 'd' in elem.attrib:
                path_data = elem.attrib['d']
                coords = []
                numbers = re.findall(r'-?\d+\.?\d*', path_data)
                
                for i in range(0, len(numbers) - 1, 2):
                    coords.append([float(numbers[i]), float(numbers[i+1])])
                
                if len(coords) >= 3:
                    simplified = simplify_coords(coords, epsilon)
                    result = f"M{simplified[0][0]:.1f},{simplified[0][1]:.1f}"
                    for point in simplified[1:]:
                        result += f"L{point[0]:.1f},{point[1]:.1f}"
                    if path_data.strip().endswith(('Z', 'z')):
                        result += "Z"
                    elem.attrib['d'] = result
        
        tree.write(output_file, encoding='utf-8', xml_declaration=True)
        return True
    except ImportError:
        print("Warning: simplification not installed")
        return False

def basic_simplify(input_file, output_file):
    import xml.etree.ElementTree as ET
    import re
    tree = ET.parse(input_file)
    root = tree.getroot()
    for elem in root.iter():
        if 'd' in elem.attrib:
            path = elem.attrib['d']
            coords = re.findall(r'-?\d+\.?\d*', path)
            rounded = [str(round(float(c), 1)) for c in coords]
            elem.attrib['d'] = re.sub(r'-?\d+\.?\d*', lambda m: rounded.pop(0) if rounded else m.group(), path)
    tree.write(output_file, encoding='utf-8', xml_declaration=True)

input_file = 'socal-map.svg'
original_size = os.path.getsize(input_file)
print(f"Original: {original_size:,} bytes ({original_size/1024/1024:.2f} MB)")

current_file = input_file
if simplify_with_scour(input_file, 'temp-scoured.svg'):
    size = os.path.getsize('temp-scoured.svg')
    print(f"After scour: {size:,} bytes - {100*(1-size/original_size):.1f}% reduction")
    current_file = 'temp-scoured.svg'

if simplify_paths_rdp(current_file, 'temp-rdp.svg'):
    size = os.path.getsize('temp-rdp.svg')
    print(f"After RDP: {size:,} bytes - {100*(1-size/original_size):.1f}% reduction")
    current_file = 'temp-rdp.svg'

output_file = 'socal-map-simplified.svg'
if current_file != input_file:
    os.rename(current_file, output_file)
else:
    basic_simplify(input_file, output_file)

final_size = os.path.getsize(output_file)
print(f"\nFinal: {final_size:,} bytes ({final_size/1024/1024:.2f} MB)")
print(f"Total reduction: {100*(1-final_size/original_size):.1f}%")

for temp in ['temp-scoured.svg', 'temp-rdp.svg']:
    if os.path.exists(temp):
        os.remove(temp)
