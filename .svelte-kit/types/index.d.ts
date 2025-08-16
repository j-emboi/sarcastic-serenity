type DynamicRoutes = {
	
};

type Layouts = {
	"/": undefined;
	"/session": undefined
};

export type RouteId = "/" | "/session";

export type RouteParams<T extends RouteId> = T extends keyof DynamicRoutes ? DynamicRoutes[T] : Record<string, never>;

export type LayoutParams<T extends RouteId> = Layouts[T] | Record<string, never>;

export type Pathname = "/" | "/session";

export type ResolvedPathname = `${"" | `/${string}`}${Pathname}`;

export type Asset = never;