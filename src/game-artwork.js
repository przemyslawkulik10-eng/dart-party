export const hasGameArtwork=mode=>['501','301','201','cricket'].includes(String(mode));
export const gameArtwork=mode=>hasGameArtwork(mode)?`<img class="game-artwork" src="/public/game-icons/${mode}.png?v=20261022" alt="" width="512" height="512" decoding="async">`:'';
