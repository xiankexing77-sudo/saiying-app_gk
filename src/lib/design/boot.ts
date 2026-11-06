import {
  DAY_PALETTE,
  DEFAULT_THEME,
  LOCALE_STORAGE_KEY,
  NIGHT_PALETTE,
  THEME_STORAGE_KEY,
  paletteStorageKey,
} from "./tokens";

/** Runs before paint. Theme, locale, and palette persist in localStorage. */
export function preferenceBootScript() {
  const defaults = { night: NIGHT_PALETTE, day: DAY_PALETTE };
  return `(function(){
function cookieValue(name){
  var match=document.cookie.match(new RegExp("(?:^|; )"+name+"=([^;]*)"));
  return match?decodeURIComponent(match[1]):"";
}
var theme=cookieValue("pji-theme")||${JSON.stringify(DEFAULT_THEME)};
var locale=cookieValue("pji-locale")||"zh";
try{
  var storedTheme=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
  if(!cookieValue("pji-theme")&&(storedTheme==="day"||storedTheme==="night")) theme=storedTheme;
  var storedLocale=localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)});
  if(!cookieValue("pji-locale")&&(storedLocale==="zh"||storedLocale==="en")) locale=storedLocale;
}catch(e){}
var defaults=${JSON.stringify(defaults)};
var palette=Object.assign({}, defaults[theme]);
try{
  var raw=localStorage.getItem(${JSON.stringify(paletteStorageKey("night"))}.replace("night", theme));
  if(raw){
    var parsed=JSON.parse(raw);
    var hex=/^#[0-9a-fA-F]{6}$/;
    ["bgStart","bgEnd","plum","cobalt","ember"].forEach(function(key){
      if(parsed && hex.test(parsed[key])) palette[key]=String(parsed[key]).toLowerCase();
    });
    var glass=Math.round(Number(parsed && parsed.glass)*100)/100;
    if(glass>=0.07 && glass<=0.1) palette.glass=glass;
  }
}catch(e){}
var root=document.documentElement;
root.dataset.theme=theme;
root.dataset.locale=locale;
root.dataset.grid=root.dataset.grid||"off";
root.lang=locale==="zh"?"zh-CN":"en";
root.classList.toggle("dark", theme==="night");
root.style.setProperty("--bg-start", palette.bgStart);
root.style.setProperty("--bg-end", palette.bgEnd);
root.style.setProperty("--glow-plum", palette.plum);
root.style.setProperty("--glow-cobalt", palette.cobalt);
root.style.setProperty("--glow-ember", palette.ember);
root.style.setProperty("--glass-alpha", String(palette.glass));
})();`;
}
