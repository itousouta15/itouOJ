export function makeRng(seed) {
  let state = seed >>> 0;
  return {
    int(lo, hi) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return lo + (state % (hi - lo + 1));
    },
  };
}
