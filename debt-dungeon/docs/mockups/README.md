# Map Prototype

**Status:** DRAFT

[Open the interactive map prototype](map.html).

This experiment asks whether a generated hex map can give one dungeon floor
recognizable regions connected by narrow passages. It uses simple map symbols;
the visuals are not a proposed art direction.

Generate a map from a repeatable seed, vary its size and openness, and inspect
labyrinth territories, terrain, and points of interest. Click an open hex to
preview a route, then move the expedition. Fog of war reveals nearby ground as
the expedition travels. Drag to pan, scroll to zoom, or use the view controls.

The map also supports keyboard selection with the arrow keys and movement with
Enter while the canvas is focused.

Movement costs, a five-hex sight radius, and four-hex territories are prototype
assumptions. Terrain transformation, diplomacy, combat, and resource collection
are not simulated. The page keeps its state in memory and can be opened directly
without a development server.

Hex coordinates, conversion, distance, and pathfinding are based on
[Red Blob Games’ Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/).
