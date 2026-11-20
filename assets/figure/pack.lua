-- Copies the Raka template's layers and slices for one character, swaps in that character's renders
-- and rebuilds the palette from its own pixels (the template's palette would snap every colour to nila).
local v = app.params.v
local root = app.fs.filePath(app.params.script or "")
if root == "" then root = "." end
for _, set in ipairs({ { tpl = "figure.aseprite", dir = "render" }, { tpl = "figure-front.aseprite", dir = "render-front" } }) do
  local spr = app.open(root .. "/" .. set.tpl)
  for _, layer in ipairs(spr.layers) do
    local cel = layer:cel(1)
    cel.image = Image{ fromFile = root .. "/" .. v .. "/" .. set.dir .. "/" .. layer.name .. ".png" }
    cel.position = Point(0, 0)
  end
  app.command.ColorQuantization{ ui = false, withAlpha = true, maxColors = 256 }
  spr:saveAs(root .. "/" .. v .. "/" .. set.tpl)
  spr:close()
end
