/* eslint-disable @typescript-eslint/no-explicit-any */
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import * as THREE from 'three'
export function loadModel( scene: THREE.Scene ) {
  const input = document.createElement( 'input' )
  input.setAttribute( "type", 'file' )
  input.setAttribute( "accept", ".json" )
  input.click()
  input.onchange = async ( e: any ) => {
    const file = e.target.files[0] as File
    const blob = URL.createObjectURL( file )
    const jsonData = await ( await fetch( blob ) ).json()
    createModel( scene, jsonData );
  }
  input.remove()
}

function createModel( scene: THREE.Scene, jsonData: any ) {
  // const { materials, geometries, object } = jsonData

  const materials: { [uuid: string]: THREE.MeshBasicMaterial } = {}
  const geometries: { [uuid: string]: THREE.BufferGeometry } = {}
  const geometryMaterials: { [uuid: string]: { material: THREE.MeshBasicMaterial, geometries: THREE.BufferGeometry[] } } = {}
  jsonData.materials.forEach( ( mat: any ) => {
    const { uuid, transparent, color, opacity } = mat
    // if ( !uuid || !transparent || !color || !opacity ) return;
    if ( !materials[uuid] ) materials[uuid] = new THREE.MeshBasicMaterial( {
      color: parseInt( color, 16 ),
      transparent,
      opacity,
      side: THREE.DoubleSide
    } )
  } );
  jsonData.geometries.forEach( ( geo: any ) => {
    const { position } = geo.data.attributes
    if ( position.array.length === 0 || position.array.length % 3 !== 0 ) return
    const uuid = geo.uuid
    if ( !geometries[uuid] ) geometries[uuid] = createGeometry( position.array )
  } );

  jsonData.object.children.forEach( ( child: any ) => {
    if ( !child.children || child.children.length === 0 ) return
    child.children.forEach( ( subChild: any ) => {
      const material = materials[subChild.material]
      const geometry = geometries[subChild.geometry]
      if ( !material || !geometry ) return
      if ( !geometryMaterials[subChild.material] ) geometryMaterials[subChild.material] = { material, geometries: [] }
      geometryMaterials[subChild.material].geometries.push( geometry )
    } )
  } );


  const newGeometries: THREE.BufferGeometry[] = [];
  const newMaterials: THREE.MeshBasicMaterial[] = [];

  console.log( geometryMaterials );
  Object.keys( geometryMaterials ).forEach( ( key ) => {
    const geometriesByMaterial = geometryMaterials[key].geometries;
    if ( geometriesByMaterial.length === 0 ) return
    const merged = mergeGeometries( geometriesByMaterial );
    newMaterials.push( geometryMaterials[key].material );
    newGeometries.push( merged );
    // geometriesByMaterial.fo
  } );

  const combinedGeometry = mergeGeometries( newGeometries, true );
  const model = new THREE.Mesh( combinedGeometry, newMaterials );
  scene.add( model )
}


function createGeometry( position: number[] ) {
  const geometry = new THREE.BufferGeometry();
  const indices: number[] = []
  for ( let i = 0; i < position.length / 3; i++ ) {
    indices.push( i )
  }
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute( new Float32Array( position ), 3 ) );
  geometry.setIndex( [...indices] );
  return geometry
}