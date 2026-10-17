# Promenade: credits and licenses

| Asset | Source | License |
|---|---|---|
| Character body (Superhero Female base mesh, textures, rig) | "Universal Base Characters" [Standard] by Quaternius, https://quaternius.com/packs/universalbasecharacters.html (downloaded from quaternius.itch.io/universal-base-characters) | CC0 1.0 Universal (public domain) |
| Long hair mesh (Hair_Long, rigged to head bone) | Same pack | CC0 1.0 |
| Walk_Loop and Idle_Loop animations | "Universal Animation Library" [Standard] by Quaternius, quaternius.itch.io/universal-animation-library | CC0 1.0 |
| three.js r180 (core, GLTFLoader, OrbitControls, Sky, BufferGeometryUtils) | https://threejs.org | MIT (see vendor/LICENSE) |

Modifications made for this app (also CC0): the skin base colour was retinted and the painted underwear was removed;
textures were resized to WebP; only the walk and idle clips were kept. At runtime the hair is tinted dark brown and extra spiral
curls are added. The gray tank top and shorts are generated from the body's own skinned surface. The necklace, bracelets and the
whole plaza are procedural. No photo is used as a texture.

Rebuild the models: download both packs, then run `tools/skin-texture.py`, `tools/build-models.mjs` and `tools/build-anims.mjs`
(Node with @gltf-transform/core, functions, extensions and sharp; edit the pack paths at the top).
