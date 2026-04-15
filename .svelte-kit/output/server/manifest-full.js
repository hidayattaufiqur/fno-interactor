export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["vite.svg"]),
	mimeTypes: {".svg":"image/svg+xml"},
	_: {
		client: {start:"_app/immutable/entry/start.DeFdURpZ.js",app:"_app/immutable/entry/app.D9f1IKeg.js",imports:["_app/immutable/entry/start.DeFdURpZ.js","_app/immutable/chunks/2SIwc9jD.js","_app/immutable/chunks/B-pWAizt.js","_app/immutable/chunks/BGyKv7BH.js","_app/immutable/chunks/CWeFt6jb.js","_app/immutable/chunks/CXlT1r-0.js","_app/immutable/entry/app.D9f1IKeg.js","_app/immutable/chunks/B-pWAizt.js","_app/immutable/chunks/D6bvHR5w.js","_app/immutable/chunks/CXlT1r-0.js","_app/immutable/chunks/BHGhXssE.js","_app/immutable/chunks/wctgZPgD.js","_app/immutable/chunks/BGyKv7BH.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/flow/[flowId]",
				pattern: /^\/flow\/([^/]+?)\/?$/,
				params: [{"name":"flowId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/flow/[flowId]/[stageId]",
				pattern: /^\/flow\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"flowId","optional":false,"rest":false,"chained":false},{"name":"stageId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/tables",
				pattern: /^\/tables\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/tables/[name]",
				pattern: /^\/tables\/([^/]+?)\/?$/,
				params: [{"name":"name","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
