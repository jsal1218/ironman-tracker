import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune, dedup, textureCompress, resample, mergeDocuments, unpartition} from '@gltf-transform/functions';
import sharp from 'sharp';
import fsx from 'fs';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
const B='/tmp/ubc/Universal Base Characters[Standard]';
const body=await io.read(B+'/Base Characters/Godot - UE/Superhero_Female_FullBody.gltf');
import fs from 'fs';
for(const t of body.getRoot().listTextures()) if(t.getName()==='T_Superhero_Female_Dark_BaseColor'){t.setImage(fs.readFileSync(B+'/Base Characters/Godot - UE/T_Female_Skin_Promenade.png'));t.setURI('skin.png')}
await body.transform(prune(),dedup(),
  textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:82}));
await io.write('/tmp/simbuild/out/body.glb',body);
const hair=await io.read(B+'/Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)/Hair_Long.gltf');
await hair.transform(prune(),dedup(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[512,512],quality:80}));
await io.write('/tmp/simbuild/out/hair.glb',hair);
const anim=await io.read('/tmp/ual/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb');
const keep=new Set(['Walk_Loop','Idle_Loop','Walk_Formal_Loop','Idle_Talking_Loop']);
for(const a of anim.getRoot().listAnimations()) if(!keep.has(a.getName())) a.dispose();
for(const m of anim.getRoot().listMeshes()) m.dispose();
for(const t of anim.getRoot().listTextures()) t.dispose();
for(const a of anim.getRoot().listAccessors()) if(a.listParents().every(p=>p.propertyType==='Root')) a.dispose();
await anim.transform(resample(),prune({keepLeaves:true}),dedup());
await io.write('/tmp/simbuild/out/anims.glb',anim);
