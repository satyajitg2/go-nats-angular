import { Injectable } from "@angular/core";
import * as L from 'leaflet';

export class AircraftSignal {
    imageUrl = 'assets/images/airplane.png';
    planeIcon = L.icon({
      iconUrl: this.imageUrl,
      iconSize: [64, 64],
      popupAnchor: [-3, -76],
      shadowUrl: ''
    });
    
  
    
    marker: L.Marker<any> | undefined;
    bearing: number = 0;
    location: L.LatLng = L.latLng(0, 0);
  
    constructor(name: string, direction: number, location: L.LatLng, map: L.Map ) {
        
        this.marker = L.marker(location, 
        {
          title: name, 
          icon: this.planeIcon
        }).addTo(map)
        //).addTo(this.map).bindPopup('AIR747');
        
    }

    updatePosition(newlocation: L.LatLng){
      this.location = newlocation
      this.marker?.setLatLng(newlocation);
    }
  
    update(signal: { callSign?: any; bearing?: any; location?: any; }) {
        this.bearing = signal.bearing;
        this.location = signal.location;
        this.marker?.setLatLng([signal.location.lat, signal.location.lng]);
    }
    
  }
  