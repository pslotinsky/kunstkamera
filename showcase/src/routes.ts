import {
  index,
  layout,
  type RouteConfig,
  route,
} from '@react-router/dev/routes';

export default [
  route('search.json', 'routes/Search.ts'),
  layout('routes/InteractiveLayout.tsx', [
    route(':project/play', 'routes/Game/Game.tsx'),
    route(':project/prototypes/:prototype', 'routes/Prototype/Prototype.tsx'),
  ]),
  layout('routes/DocumentationLayout.tsx', [
    index('routes/DocumentationIndex/DocumentationIndex.tsx'),
    route(':project/docs/*', 'routes/Documentation/Documentation.tsx'),
    route('*', 'routes/NotFound/NotFound.tsx'),
  ]),
] satisfies RouteConfig;
