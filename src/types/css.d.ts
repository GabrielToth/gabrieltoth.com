// TypeScript 6 reports TS2882 for side-effect CSS imports unless a module
// declaration exists. Next's generated types only cover `*.module.css` globs,
// so declare the plain `*.css` side-effect imports used across the app
// (e.g. `./globals.css`, `react-international-phone/style.css`).
declare module "*.css"
