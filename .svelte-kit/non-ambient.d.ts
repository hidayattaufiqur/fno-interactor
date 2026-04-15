
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/flow" | "/flow/[flowId]" | "/flow/[flowId]/[stageId]" | "/tables" | "/tables/[name]";
		RouteParams(): {
			"/flow/[flowId]": { flowId: string };
			"/flow/[flowId]/[stageId]": { flowId: string; stageId: string };
			"/tables/[name]": { name: string }
		};
		LayoutParams(): {
			"/": { flowId?: string; stageId?: string; name?: string };
			"/flow": { flowId?: string; stageId?: string };
			"/flow/[flowId]": { flowId: string; stageId?: string };
			"/flow/[flowId]/[stageId]": { flowId: string; stageId: string };
			"/tables": { name?: string };
			"/tables/[name]": { name: string }
		};
		Pathname(): "/" | `/flow/${string}` & {} | `/flow/${string}/${string}` & {} | "/tables" | `/tables/${string}` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/vite.svg" | string & {};
	}
}