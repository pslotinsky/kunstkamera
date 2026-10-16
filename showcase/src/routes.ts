import {
  index,
  layout,
  type RouteConfig,
  route,
} from '@react-router/dev/routes';

export default [
  route(':project/search.json', 'routes/Search.ts'),
  layout('routes/ProjectInteractive.tsx', [
    route(':project/play', 'routes/Game/Game.tsx'),
    route(':project/prototypes/:prototype', 'routes/Prototype/Prototype.tsx'),
  ]),
  layout('routes/ProjectDocumentation.tsx', [
    route(':project/docs/*', 'routes/Documentation/Documentation.tsx'),
  ]),
  layout('routes/Site/Site.tsx', [
    index('routes/Home/Home.tsx'),
    route('*', 'routes/NotFound/NotFound.tsx'),
  ]),
] satisfies RouteConfig;
