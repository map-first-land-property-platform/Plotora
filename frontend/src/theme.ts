export const THEME_SCRIPT =
  "try{var t=localStorage.getItem('plotora-theme')||'system';if(t==='system')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}";

export const PLOTORA_STYLES = [
  '/assets/styles/base.css',
  '/assets/styles/components.css',
  '/assets/styles/layouts.css',
  '/assets/styles/pages.css',
  '/assets/styles/portal.css',
  '/assets/styles/minimal-redesign.css',
] as const;
