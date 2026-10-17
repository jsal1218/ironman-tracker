import {NodeIO} from '@gltf-transform/core';
import {prune,dedup,resample} from '@gltf-transform/functions';
const io=new NodeIO();
const anim=await io.read('/tmp/ual/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb');
const r=anim.getRoot();console.log('acc0',r.listAccessors().length);
const keep=new Set(['Walk_Loop','Idle_Loop','Walk_Formal_Loop','Idle_Talking_Loop']);
for(const a of r.listAnimations()) if(!keep.has(a.getName())){for(const s of a.listSamplers()){const i=s.getInput(),o=s.getOutput();s.dispose();} for(const c of a.listChannels())c.dispose(); a.dispose();}
for(const m of r.listMeshes()) m.dispose();
console.log('acc1',r.listAccessors().length);
await anim.transform(prune(),resample(),prune(),dedup());
console.log('acc2',r.listAccessors().length);
await io.write('/tmp/simbuild/out/anims.glb',anim);
