export const THEME_KEY = "cs2_theme";

/**
 * Runs in <head> before first paint so the page never flashes the wrong theme.
 * Keep in sync with applyTheme() in lib/theme.ts.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem("${THEME_KEY}");var d=p==="dark"||(p!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";}catch(e){}})();`;
