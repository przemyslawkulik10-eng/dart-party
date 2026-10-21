export function remainingDarts(state) {
  const count=state.ready?0:3-state.turn.length;
  return `<div class="remaining-darts" role="img" aria-label="Pozostałe lotki: ${count}">${[0,1,2].map(i=>`<svg class="remaining-dart ${i<count?'available':'used'}" viewBox="0 0 100 52" aria-hidden="true"><g transform="rotate(156 50 26)"><path d="M7 26 L29 26" stroke="#cdd8d1" stroke-width="2"/><path d="M29 22 L57 22 L61 26 L57 30 L29 30 Z" fill="#dce4df"/><path d="M34 22v8m5-8v8m5-8v8m5-8v8" stroke="#71877b" stroke-width="2"/><path d="M60 26H80" stroke="#4ff0cf" stroke-width="4"/><path d="M70 25L81 12L94 12L86 26L94 40L81 40L70 27" fill="#44cfff"/><path d="M73 26H91" stroke="#14639c" stroke-width="2"/></g></svg>`).join('')}</div>`;
}

