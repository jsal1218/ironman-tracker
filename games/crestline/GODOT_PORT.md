# Crestline Rally: Godot port notes

The browser build is a playable mockup. Gameplay, data, and meta systems are split so each file maps to one Godot piece:

| Web file | Godot equivalent |
|---|---|
| `config.js` (`CRESTLINE` object) | `res://data/crestline_config.tres` (custom `Resource`) or a JSON file loaded by an autoload |
| `run.js` (terrain, car physics, stunts, pickups, render) | `Run.tscn`: `Terrain` (Node2D + `Polygon2D`/`CollisionPolygon2D`), `Car` (`RigidBody2D`), `Pickups`, `Camera2D`, HUD `CanvasLayer` |
| `meta.js` (save, wallet, garage, daily, leaderboard, ads/IAP mocks, screens) | Autoloads `SaveGame`, `Economy`, `Ads`, `Store`, plus `Menu.tscn`, `Garage.tscn`, `Shop.tscn`, `Results.tscn`, `DailyPopup.tscn` |

## Mechanics

- **Controls (one thumb):** hold the right half of the screen for gas and the left half for brake/reverse. Multitouch is fine. In the air, gas rotates the car nose-up (backflip) at `car.air * 0.75` rad/s², and brake rotates it nose-down. On the ground there is a small lean torque (`air * I * 0.05`). Keyboard: arrows or WASD.
- **Units:** 30 px = 1 m, gravity 900 px/s², 8 physics substeps per frame. In Godot, use `RigidBody2D` with gravity scale tuned to 900, or keep the custom integrator in `_physics_process` at 120–240 Hz.
- **Car model:** one rigid chassis (mass `m`, inertia `m·(w²+h²)/12·1.1`). Each of the two wheels is a spring-damper raycast:
  - Normal force: `k·5·m·compression − c·1.2·m·v_n`, plus a bump stop of 900 above 12 px of travel.
  - Drive: `power·m/2·(1 − v_t/topSpeed)`. Brake: 1000·m/2, then reverse at 45% power, capped at 220 px/s.
  - Tangential force is clamped by `grip · normal`, and drive force is applied at the wheel anchor.
  - Godot equivalent: two `RayCast2D` or `ShapeCast2D` suspensions on a `RigidBody2D` (more stable than `PinJoint2D` wheels for this feel).
- **Crash:** the helmet or roof points touch the ground, or the car stays upside-down while touching the ground for 1.0 s. **Out of fuel:** fuel is 0 and speed stays below 18 px/s for 1.4 s.
- **Terrain:** a seeded random walk of control points every 150 px, Catmull-Rom interpolated.
  - Amplitude grows with distance (26 → 121 px per segment) and slopes are clamped to about 32°.
  - About 11% of segments past 1,400 px become kickers (two-step lip, then a drop).
  - Rocks (r 10–23, 45% of the radius above ground) act as both terrain and hazard. Coin arcs of 4–6 coins appear on about 42% of segments.
- **Fuel:** the tank equals `car.fuel` units. It burns `car.burn`/s at full gas and 22% of that when coasting.
  - Fuel cans refill to full. The first can is at 250 m, and each gap is `250 + 60·n` m (250, 560, 930, 1360, 1850 …), so runs naturally last 1–3 minutes.
- **Stunts (scored on landing):**
  - Flip: +150 each, +100 per extra flip in the same jump. Flips are counted from accumulated air rotation with a 40° tolerance.
  - Big air: 60 pts/s once airtime ≥ 1.0 s.
  - Clean landing (both wheels, within 0.22 rad of the slope after ≥ 0.6 s of air): +50 and a small speed boost.
  - Close pass (clearing a rock with 0–46 px clearance without touching it): +75.
- **Score:** metres travelled + stunt points.

## Cars (garage)

| id | Name | Price | power | topSpeed | grip | fuel | burn/s | air |
|---|---|---|---|---|---|---|---|---|
| pebble | Pebble Buggy | 0 | 620 | 640 | 1.05 | 100 | 2.0 | 6.0 |
| hopper | Dune Hopper | 1,500 | 680 | 690 | 1.00 | 95 | 1.9 | 8.5 |
| ridge | Ridge Hauler | 4,000 | 820 | 660 | 1.35 | 150 | 2.1 | 4.8 |
| bolt | Bolt GT | 9,000 | 900 | 900 | 0.90 | 110 | 2.4 | 6.5 |
| lunar | Lunar Rover | 16,000 | 760 | 760 | 1.15 | 130 | 1.4 | 9.5 |

Paints (6) are free for owned cars. Coin skins: Rally Stripe 800 and Checker 1,200. Premium skins (IAP): Aurora and Gilded. Paint and skin choices are stored per car.

## Economy

- Starting coins: 250. Coin pickup: 5 each.
- Run payout = pickups + `floor(m × 0.1)` + `floor(stuntPts × 0.05)`. Coins are banked when the run ends; after a revive, only the new coins are banked.
- Daily streak (local calendar day): 100, 150, 200, 300, 400, 600, 1000.
  - Claim once per day. Missing a day resets the streak to day 1, and after day 7 it loops back to day 1.
- Rewarded ads:
  - Revive with 50% fuel (once per run).
  - Double the run's coins (once per run).
  - +25% fuel on the next run.
  - +150 coins in the shop.
- Local leaderboard: top 10 runs `{score, dist, car, flips, date}`. Online leaderboards (Game Center) are future work.
- Save: `localStorage['dash-games-crestline-save']` holds `{v, coins, cars[], car, paint{carId:paintOrSkin}, skins[], adsRemoved, daily{last,streak}, board[], runs, boost, purchases[]}`. Port to `user://save.json` via `FileAccess` (or `ConfigFile`), with the same schema and a version field for migrations.

## Ads and IAP mapping (iOS)

The web build has **no SDKs**. `showAd()` is a 5-second "Ad placeholder" overlay, and `buy()` is a "Purchase mockup, no charge" dialog.

| Mockup | iOS build |
|---|---|
| `showAd(kind, onReward)` placeholder | **AdMob rewarded** (Google Mobile Ads plugin for Godot). Grant the reward only in `on_user_earned_reward`. Preload one ad and keep the button disabled until it is loaded. Rewarded ads are always opt-in, with no interstitials. |
| Ad consent | Show **ATT** (`ATTrackingManager.requestTrackingAuthorization`) only after a short pre-prompt explaining the benefit, and before the first ad request. Use Google UMP for GDPR/US-state consent. If the user declines, request non-personalized ads. Add `NSUserTrackingUsageDescription` and the SKAdNetwork IDs to Info.plist. |
| `buy(productId)` dialog | **StoreKit 2** via a Godot iOS plugin. Products: `coins_s` $0.99 (1,000), `coins_m` $4.99 (6,000), `coins_l` $9.99 (15,000) are consumables; `skin_aurora` $1.99, `skin_gilded` $2.99, `remove_ads` $2.99 are non-consumables. Show the localized `displayPrice`, never hard-coded prices. |
| `remove_ads` | Non-consumable entitlement. In the mockup it skips the placeholder and grants rewards directly. In production it removes any banner/interstitial inventory (none are planned). Rewarded ads stay optional; only drop the ad step if you decide to give rewards for free. |
| Grants | Verify `Transaction` results (JWS) with `Transaction.currentEntitlements` on launch, call `finish()` on consumables, and include a **Restore Purchases** button (`AppStore.sync()`) in Shop. |

Rating notes: rated for everyone (cartoon driving, no violence: crashes are a "bonk", the driver is never hurt), not directed at children. Still, avoid personalized ads for users who indicate they are minors, and keep the UMP/ATT flow.
