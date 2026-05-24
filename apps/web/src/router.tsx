import { QueryClient } from '@tanstack/react-query';
import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router';
import { z } from 'zod';
import { AppLayout } from './pages/AppLayout';
import { JoinInvite } from './pages/JoinInvite';
import { PartiesList } from './pages/PartiesList';
import { PartyDetail } from './pages/PartyDetail';
import { PartyNew } from './pages/PartyNew';
import { Settings } from './pages/Settings';
import { SignIn } from './pages/SignIn';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 30_000,
    },
  },
});

type RouterContext = { queryClient: QueryClient };

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <div className="h-dvh bg-bg text-fg flex flex-col">
      <Outlet />
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/parties' });
  },
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signin',
  validateSearch: z.object({
    next: z.string().optional(),
    error: z.enum(['oauth']).optional(),
  }),
  component: SignIn,
});

const joinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/join/$token',
  component: JoinInvite,
});

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_app',
  component: AppLayout,
});

const partiesIndexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/parties',
  component: PartiesList,
});

const partyNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/parties/new',
  component: PartyNew,
});

const partyDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/parties/$partyId',
  component: PartyDetail,
});

const settingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings',
  component: Settings,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  signInRoute,
  joinRoute,
  appLayoutRoute.addChildren([partiesIndexRoute, partyNewRoute, partyDetailRoute, settingsRoute]),
]);

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
