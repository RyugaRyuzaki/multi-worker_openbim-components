/* eslint-disable @typescript-eslint/no-explicit-any */
import * as OBC from 'openbim-components'
import { DataConverterSignal, IIfcGeometries, IIfcProperties, IfcGeometriesSignal, IfcPropertiesSignal, disposeSignal } from './Signal';
import { effect } from '@preact/signals-react';
export * from './Signal'
export class IfcWorker extends OBC.Component<Worker> implements OBC.Disposable {
  enabled = true;
  private readonly _DataConverterSignal: DataConverterSignal;
  private geometryWorker: Worker = new Worker( "./IfcGeometryWorker.js" )
  private propertyWorker: Worker = new Worker( "./IfcPropertyWorker.js" )
  get( ...args: any ): Worker {
    throw new Error( 'Method not implemented.' );
  }
  /**
   *
   */
  constructor( components: OBC.Components ) {
    super( components );
    this._DataConverterSignal = new DataConverterSignal();
    this.onMessage()
  }
  async dispose() {
    this.geometryWorker.terminate();
    ( this.geometryWorker as any ) = null;
    this.propertyWorker.terminate();
    ( this.propertyWorker as any ) = null;
    disposeSignal()
  }
  private onMessage() {
    this.geometryWorker.onmessage = async ( e: any ) => {
      const { items, coordinationMatrix, error } = e.data
      if ( error ) return
      IfcGeometriesSignal.value = { items, coordinationMatrix } as IIfcGeometries
    }
    this.propertyWorker.onmessage = async ( e: any ) => {
      const { error, categories, uuid, ifcMetadata, properties, itemsByFloor } = e.data
      if ( error ) return
      IfcPropertiesSignal.value = { categories, uuid, ifcMetadata, properties, itemsByFloor } as IIfcProperties
    }
    effect( async () => {
      if ( !IfcGeometriesSignal.value || !IfcPropertiesSignal.value ) return;
      const model = await this._DataConverterSignal.generate( IfcGeometriesSignal.value, IfcPropertiesSignal.value )
      const scene = this.components.scene.get()
      scene.add( model )
      this.geometryWorker.terminate();
      ( this.geometryWorker as any ) = null;
      this.propertyWorker.terminate();
      ( this.propertyWorker as any ) = null;
      this._DataConverterSignal.cleanUp()
      IfcGeometriesSignal.value = null
      IfcPropertiesSignal.value = null
    } )
  }
  loadModel() {
    const input = document.createElement( "input" );
    input.setAttribute( "type", "file" );
    input.setAttribute( "accept", `.ifc` );
    input.click();
    input.onchange = async ( e: any ) => {
      const file = e.target?.files[0] as File;
      const buffer = await file.arrayBuffer()
      const dataArray = new Uint8Array( buffer );
      this.geometryWorker.postMessage( dataArray )
      this.propertyWorker.postMessage( dataArray );
    };
    input.remove();
  }

}