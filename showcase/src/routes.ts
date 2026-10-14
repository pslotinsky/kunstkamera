import {
  index,
  layout,
  type RouteConfig,
  route,
} from '@react-router/dev/routes';

export default [
  route('gemfire/search.json', 'routes/Search.ts'),
  layout('routes/ProjectGame.tsx', [
    route('gemfire/play', 'routes/Game/Game.tsx'),
  ]),
  layout('routes/ProjectDocumentation.tsx', [
    route('gemfire/docs/*', 'routes/Documentation/Documentation.tsx'),
  ]),
  layout('routes/Site/Site.tsx', [
    index('routes/Home/Home.tsx'),
    route('*', 'routes/NotFound/NotFound.tsx'),
  ]),
] satisfies RouteConfig;
