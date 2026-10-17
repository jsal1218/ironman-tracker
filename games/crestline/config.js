// Crestline Rally: all tunable data in one object (physics, cars, paints, economy, shop, daily rewards, ads).
// Mirrors a Godot Resource / autoload singleton; see GODOT_PORT.md.
window.CRESTLINE=Object.freeze({
 version:1,
 saveKey:'dash-games-crestline-save',
 physics:{
  pxPerMeter:30,      // world units: pixels; 1 m = 30 px
  gravity:900,        // px/s^2
  substeps:8,         // physics steps per rendered frame
  suspTravel:12,      // px of spring travel above wheel radius
  stopStiffness:900,  // bump-stop spring when suspension bottoms out
  bodyStiffness:1600, // chassis corner vs ground
  angularDamping:.35,
  airTiltMax:6.5,     // rad/s cap while airborne
  crashUpsideSec:1.0, // upside-down on the ground this long = crash
  stallSec:1.4        // out of fuel and stopped this long = run over
 },
 // stats shown in the garage are 1-5 bars derived from these numbers
 cars:[
  {id:'pebble',name:'Pebble Buggy',price:0,desc:'Light, forgiving starter buggy.',power:620,topSpeed:640,grip:1.05,fuel:100,burn:2.0,air:6.0,mass:1,k:80,c:9,wheelbase:66,wheelR:15,body:'buggy',bars:{speed:2,grip:3,fuel:3,air:3}},
  {id:'hopper',name:'Dune Hopper',price:1500,desc:'Long-travel springs and huge air control.',power:680,topSpeed:690,grip:1.0,fuel:95,burn:1.9,air:8.5,mass:.9,k:70,c:8,wheelbase:70,wheelR:17,body:'hopper',bars:{speed:3,grip:3,fuel:3,air:5}},
  {id:'ridge',name:'Ridge Hauler',price:4000,desc:'Heavy 4x4 with a big tank and sticky tires.',power:820,topSpeed:660,grip:1.35,fuel:150,burn:2.1,air:4.8,mass:1.3,k:110,c:13,wheelbase:80,wheelR:18,body:'truck',bars:{speed:3,grip:5,fuel:5,air:2}},
  {id:'bolt',name:'Bolt GT',price:9000,desc:'Blistering top speed, twitchy on loose ground.',power:900,topSpeed:900,grip:.9,fuel:110,burn:2.4,air:6.5,mass:1,k:95,c:11,wheelbase:78,wheelR:14,body:'gt',bars:{speed:5,grip:2,fuel:3,air:3}},
  {id:'lunar',name:'Lunar Rover',price:16000,desc:'Efficient electric drive and floaty, precise flips.',power:760,topSpeed:760,grip:1.15,fuel:130,burn:1.4,air:9.5,mass:.85,k:75,c:9,wheelbase:84,wheelR:16,body:'rover',bars:{speed:4,grip:4,fuel:5,air:5}}
 ],
 paints:[ // free colors, available for every owned car
  {id:'sunset',name:'Sunset',a:'#ff7a3d',b:'#c94a1a'},{id:'dash',name:'Dash Green',a:'#1fa774',b:'#0b6e4f'},{id:'lagoon',name:'Lagoon',a:'#2bb3d9',b:'#16708c'},
  {id:'berry',name:'Berry',a:'#d0458f',b:'#8a2560'},{id:'ink',name:'Ink',a:'#34404a',b:'#151c22'},{id:'pearl',name:'Pearl',a:'#f1efe8',b:'#b8b2a3'}
 ],
 skins:[ // pattern skins: coin skins unlock with coins, premium skins are IAP mockups
  {id:'stripe',name:'Rally Stripe',kind:'coins',price:800,a:'#f4f1e8',b:'#d23c2c',pattern:'stripe'},
  {id:'checker',name:'Checker',kind:'coins',price:1200,a:'#222a30',b:'#f4f1e8',pattern:'checker'},
  {id:'aurora',name:'Aurora',kind:'premium',product:'skin_aurora',a:'#6f4bd8',b:'#2bd9b8',pattern:'gradient'},
  {id:'gilded',name:'Gilded',kind:'premium',product:'skin_gilded',a:'#fbe9a6',b:'#9a7419',pattern:'gold'}
 ],
 economy:{
  startCoins:250,
  coinValue:5,              // per coin pickup
  coinsPerMeter:.1,         // results payout: floor(distance * this)
  coinsPerStuntPoint:.05,   // results payout: floor(stunt points * this)
  fuelCanFirstM:250, fuelCanStepM:60, // can n sits at first + n*(n+1)/2*step ... see run.js
  flipPoints:150, multiFlipBonus:100, airPointsPerSec:60, airMinSec:1.0, closePassPoints:75, perfectLandingPoints:50,
  closePassClearancePx:46,
  fuelBoostPct:25,          // rewarded-ad pre-run boost
  adCoins:150               // rewarded-ad coin grant in the shop
 },
 daily:[100,150,200,300,400,600,1000], // 7-day streak calendar, day 7 loops back to day 1 after claim
 shop:{ // prices are display strings only: MOCKUP, nothing is charged
  products:[
   {id:'coins_s',name:'Pouch of coins',coins:1000,price:'$0.99'},
   {id:'coins_m',name:'Chest of coins',coins:6000,price:'$4.99',tag:'Popular'},
   {id:'coins_l',name:'Vault of coins',coins:15000,price:'$9.99',tag:'Best value'},
   {id:'skin_aurora',name:'Aurora skin',skin:'aurora',price:'$1.99'},
   {id:'skin_gilded',name:'Gilded skin',skin:'gilded',price:'$2.99'},
   {id:'remove_ads',name:'Remove Ads',removeAds:true,price:'$2.99'}
  ]
 },
 ads:{ // rewarded only, always opt-in; placeholder overlay stands in for AdMob rewarded
  placeholderSec:5,
  reviveFuelPct:50,
  rewards:{revive:'Revive with 50% fuel',double:'Double run coins',boost:'+25% fuel next run',coins:'+150 coins'}
 }
});
