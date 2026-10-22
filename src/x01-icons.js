export const hasX01Icon=mode=>['501','301','201'].includes(String(mode));
export const x01Icon=mode=>hasX01Icon(mode)?`<img class="x01-icon" src="/public/game-icons/${mode}.png?v=20261022" alt="" width="512" height="512" decoding="async">`:'';
