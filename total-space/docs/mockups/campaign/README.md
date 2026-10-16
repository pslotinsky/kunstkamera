# Campaign UI Mockups

**Reference:** campaign wireframe derived from prototype v12.19.

**Interactive artifact:** [Open the campaign prototype](./prototype.html). The available HTML file identifies itself as v12.15; the interaction notes below refer to the later v12.19 design.

These artifacts document the current campaign UI structure and interaction model. They are not final visual design. Gameplay rules remain canonical in [../../game/](../../game/); this directory should not be used to infer rules that are not explicitly described there.

The prototype is a UI exploration. The interaction notes below remain the reference for the later campaign design.

## Interaction Notes

- The campaign has two primary views: Galaxy and Star System.
- Planet and Fleet details are contextual states rather than separate full-screen views.
- Selecting a different context replaces the lower panel instead of stacking panels.
- Fleet selection uses left click; map commands such as movement or attack use right click.
- Foreign and neutral planet cards hide their building composition.
- The Star System background can gain or lose vertical space as the contextual panel changes height, while planet/orbit geometry remains width-driven and does not jump vertically with panel height.
- The visible system links are the Routes fleets travel along. The wireframe only approximates movement along them; canonical movement consumes a continuous movement reserve according to distance travelled and can end with a Fleet part-way along a Route.

## Asset Reuse

The prototype references the canonical ship images from [../../game/content/ships/images/](../../game/content/ships/images/) and building images from [../../game/content/buildings/images/](../../game/content/buildings/images/). Those source assets are not duplicated under `mockups/`.
