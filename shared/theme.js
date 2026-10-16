// Applies the saved Dash theme before first paint (light | dark | auto). Loaded synchronously in <head>.
try{const t=localStorage.getItem('dash-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}
