---
publish: true
title: "SVG Debug: YAML Field Mapping with CSV"
date: 2026-02-27T00:00:00
tags:
  - debug
  - svg
  - yaml
  - csv
---

# YAML Front Matter + CSV Data

Testing the YAML front matter format with CSV data and custom field mappings.

## Bar Chart with Custom Field Names

CSV columns `city` and `population` are mapped to the expected `label` and `value` fields.

```bar
---
type: bar
width: 700
height: 350
labelField: city
valueField: population
---
city,population
Los Angeles,3900000
San Diego,1420000
San Jose,1010000
San Francisco,870000
Long Beach,460000
Oakland,430000
```

## Horizontal Bar via YAML Config

Orientation and field mapping both specified in front matter.

```chart
---
orientation: horizontal
width: 650
height: 300
labelField: item
valueField: count
---
item,count
Tacos,89
Burritos,74
Enchiladas,56
Quesadillas,48
Tamales,35
```

## Scatter Plot with Custom Fields

CSV columns `temp` and `rainfall` mapped to `x` and `y`, with `region` as category.

```scatter
---
type: scatter
width: 600
height: 400
xField: temp
yField: rainfall
categoryField: region
---
temp,rainfall,region
65,12,Coastal
70,10,Coastal
72,8,Coastal
80,4,Inland
85,3,Inland
90,2,Inland
75,15,Mountain
68,18,Mountain
62,22,Mountain
```

## Line Chart with Custom Fields

CSV with custom column names mapped via YAML.

```line
---
type: line
width: 700
height: 350
xField: month
yField: sales
categoryField: store
---
month,sales,store
1,120,Downtown
2,135,Downtown
3,148,Downtown
4,162,Downtown
5,175,Downtown
6,190,Downtown
1,95,Westside
2,102,Westside
3,110,Westside
4,118,Westside
5,125,Westside
6,130,Westside
```

## Heikin-Ashi with Custom Fields

OHLC data with non-standard column names remapped via YAML.

```heikin-ashi
---
type: heikin-ashi
width: 800
height: 400
dateField: day
openField: o
highField: h
lowField: l
closeField: c
---
day,o,h,l,c
2026-02-16,180.50,183.20,179.80,182.10
2026-02-17,182.10,185.40,181.50,184.20
2026-02-18,184.20,186.70,183.10,183.90
2026-02-19,183.90,184.50,180.20,181.30
2026-02-20,181.30,182.80,178.90,179.50
2026-02-23,179.50,181.20,177.40,180.60
2026-02-24,180.60,183.50,180.10,182.80
2026-02-25,182.80,186.20,182.30,185.40
```

## Donut with Custom Fields

Donut chart using CSV with field remapping.

```donut
---
type: donut
width: 450
height: 450
labelField: category
valueField: pct
---
category,pct
Residential,42
Commercial,28
Industrial,18
Agricultural,12
```

All six chart types are demonstrated with YAML front matter field mapping and CSV input data.
