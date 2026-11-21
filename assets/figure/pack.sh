#!/bin/sh
# Packs each character's renders (from variants.py) into the sheets the site loads.
set -e
cd "$(dirname "$0")"
for v in ayu sekar bima; do
  aseprite -b --script-param v=$v --script-param script="$PWD/pack.lua" --script pack.lua
  for view in "figure:$v" "figure-front:$v-front"; do
    src=${view%%:*} out=${view#*:}
    aseprite -b --split-layers --trim --list-layers --list-slices --filename-format "{layer}" "$v/$src.aseprite" \
      --sheet-pack --shape-padding 2 --color-mode indexed --format json-hash \
      --sheet "../../public/figure/$out.png" --data "../../lib/figure-$out.json"
  done
done
