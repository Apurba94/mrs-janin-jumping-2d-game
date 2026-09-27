// Paper-Cut Dash assets. Everything the game needs ships in client/public.

export const ASSETS = {
  logo: "/mrs-janin-logo.svg",
};

// Optional canvas art, e.g. { world: "/world.png", runner: "/runner.png" }.
// The game draws its procedural hills and paper-cut runner when these are absent.
const CANVAS_ART = {};

export function preloadAssets() {
  return Object.fromEntries(
    Object.entries(CANVAS_ART).map(([name, source]) => {
      const image = new Image();
      image.decoding = "async";
      image.src = source;
      return [name, image];
    })
  );
}
