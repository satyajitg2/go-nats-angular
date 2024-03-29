/*
 * @author  Satyajit Singh
 */

import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { NatsConnection, StringCodec, Subscription, connect } from 'nats.ws';
import { Feature } from 'geojson';
import { LineString } from 'geojson';
import { AircraftSignal } from '../AircraftSignal';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})


export class MapComponent implements AfterViewInit {
  imageUrl = 'assets/images/airplane.png';
  icon = {
    icon: L.icon({
      iconSize: [25, 41],
      iconAnchor: [13, 0],
      iconUrl: './node_modules/leaflet/dist/images/marker-icon.png',
      shadowUrl: './node_modules/leaflet/dist/images/marker-shadow.png'
    })
  };

   planeIcon = L.icon({
    iconUrl: this.imageUrl,
    iconSize: [64, 64],
    popupAnchor: [-3, -76],
    shadowUrl: ''
  });
  
  tFlngBnd = -80;
  tFlatBnd = -45;
    
  //TODO: use rotated marker along with direction
  aircraft: AircraftSignal | undefined;
  map: L.Map | undefined;
  conn: NatsConnection | any;
  sub: any;
  circle: L.Circle<any> | undefined;
  unitsGeoJson: L.GeoJSON;

  marker: L.Marker<any> | undefined;
  marker2: L.Marker<any> | undefined;

  geojsonFeature: Feature = {
    "type": "Feature",
    "properties": {
        "name": "Coors Field",
        "amenity": "Baseball Stadium",
        "popupContent": "This is where the Rockies play!"
    },
    "geometry": {
        "type": "Point",
        "coordinates": [120, 29]
    }
  };

  geojsonFeature2: Feature = {
    "type": "Feature",
    "properties": {
        "name": "Coors Field",
        "amenity": "Baseball Stadium",
        "popupContent": "This is where the Rockies play!"
    },
    "geometry": {
        "type": "Point",
        "coordinates": [140, 39]
    }
  };

  constructor() {
    this.unitsGeoJson = L.geoJSON();
    const res = this.connectNats();
    this.natsSubscribe();
  }

  natsSubscribe() {
    //create a simple subscriber and iterate over messages
    //matching the 
    this.sub = this.conn?.subscribe("hello.*");
    const subjectStr = this.sub?.getSubject();
    console.log(subjectStr);

    //Send a message to hello.leaflet subject
    this.conn?.publish("hello.leaflet", "Message from leaflet to leaflet");
  }
  async connectNats() {
    const sc = StringCodec();
    this.conn = await connect(
      {
        servers: ["ws://localhost:8080", "wss://localhost:2229", "locahost:9111"],
      }
    );

    this.traceFlight();
    this.traceFlight2();
    this.traceAircraft();
    
    this.geoJsonMessage();
    
    console.log("Connected to Nats using ",this.conn)
    this.conn.publish("hello.nats_server", sc.encode("Nats ws UI says hello"));

  }

  async traceAircraft() {
  
    const sc = StringCodec();
    //TODO: Remove these when nats streaming server publishes
    //      actual signals in geojson or other format
    const latBounds = -45;
    const longBounds = -80;

    const s = this.conn?.subscribe("hello.aircraft");

    for await (const msg of s) {
      var latVar = latBounds; //0-90
      var lngVar = longBounds; //0-180
      
      latVar = latVar+ (parseInt(sc.decode(msg.data))/5000);
      lngVar = lngVar+ (parseInt(sc.decode(msg.data))/5000);
      
      console.log("updating position ",latVar, lngVar)

      
      if(latVar > 80) {
        latVar = latBounds;
      }
      if(lngVar > 99) {
        lngVar = longBounds;
      }
      this.aircraft?.updatePosition(L.latLng(latVar, lngVar));
    }
  }

  async geoJsonMessage() {
    const sc = StringCodec();
    const s = this.conn.subscribe("geojson.feature");
    for await(const msg of s) {
      const geoJsonData = sc.decode(msg.data);
      console.log("GEOJSON message received", geoJsonData);
    }
  }

  async traceFlight(){
    const sc = StringCodec();
    //TODO: Remove these when nats streaming server publishes
    //      actual signals in geojson or other format
    
    //COMAMND to launch streaming
    //nats -s ws://localhost:8080 req 'hello.F22' {{.Count}} --count 5000

    //This nats cli streaming simulates latitude variation for the circle marker
    //which updates on frontend like a moving circle
    //TODO: Frontend is unable to keepup with streams and keeps moving the circle
    //until entire stream is consumed
    const s = this.conn?.subscribe("hello.F22");

    for await (const msg of s) {
      var latVar = this.tFlatBnd; //0-90
      var lngVar = this.tFlngBnd; //0-180
      
      latVar = latVar+ (parseInt(sc.decode(msg.data))/5000);
      lngVar = lngVar+ (parseInt(sc.decode(msg.data))/5000);

      if(latVar > 80) {
        latVar = this.tFlatBnd;
      }
      if(lngVar > 99) {
        lngVar = this.tFlngBnd;
      }

      this.map?.setView(L.latLng(latVar, lngVar))
      
      this.marker?.setLatLng(L.latLng(latVar, lngVar));

    }
  }
  
  async traceFlight2(){
    const sc = StringCodec();
    //TODO: Remove these when nats streaming server publishes
    //      actual signals in geojson or other format
    const longBounds = -80;
    const latBounds = -45;

    //COMAMND to launch streaming
    //nats -s ws://localhost:8080 req 'hello.a380' {{.Count}} --count 10000
    //Setview is not called on this marker

    const s = this.conn?.subscribe("hello.a380");

    for await (const msg of s) {
      var latVar = latBounds; //0-90
      var lngVar = longBounds; //0-180
      
      latVar = latVar+ (parseInt(sc.decode(msg.data))/5000);
      lngVar = lngVar+ (parseInt(sc.decode(msg.data))/5000);
      //console.log("msg.data", parseInt(sc.decode(msg.data)));

      if(latVar > 80) {
        latVar = latBounds;
      }
      if(lngVar > 99) {
        lngVar = longBounds;
      }

      //console.log(latVar, lngVar);
      this.marker2?.setLatLng(L.latLng(latVar, lngVar));
      //TODO: set direction to marker
      //TODO: set last known lat lng
      
    }
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  onMapClick(e: any) {
    alert("You clicked the map at "+e.latlng);
  }



  private initMap(): void{
    this.map = L.map('map', {
      center: [8.16, 114.111],
      zoom: 3
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      id: "tileLayerid",
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    tiles.addTo(this.map);
    this.map.setZoom(3);
    this.map.on('click', this.onMapClick);

    
    this.marker = L.marker(L.latLng(24, 79), 
      {
        title: "AIR747", 
        icon: this.planeIcon
      }
    ).addTo(this.map).bindPopup('AIR747');

    

    this.marker2 = L.marker(L.latLng(0, 50), 
      {
        title: "AIR380", 
        icon: this.planeIcon,
        autoPan: true
      }
    ).addTo(this.map).bindPopup('AIR380');

    L.geoJSON(this.geojsonFeature).addTo(this.map);
    L.geoJSON(this.geojsonFeature2).addTo(this.map);

    this.aircraft = new AircraftSignal("AIR9209", 20, L.latLng(4, 89),  this.map);
  }
}

/*
    var geojsonFeature: Feature = {
      "type": "Feature",
      "properties": {
          "name": "Coors Field",
          "amenity": "Baseball Stadium",
          "popupContent": "This is where the Rockies play!"
      },
      "geometry": {
          "type": "Point",
          "coordinates": [120, 29]
      }
    };

    L.geoJSON(geojsonFeature).addTo(this.map);


    var geoJsonI = {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {},
          "geometry": {
            "coordinates": [
              82.74460469085648,
              22.34514051525167
            ],
            "type": "Point"
          }
        }
      ]
    };
    this.circle = L.circle([24.98, 77.76], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5,
      radius: 500000
    }).addTo(this.map);

    this.circle.bindPopup("circle popup").openPopup();

    //Add Geojson Lines
    var myLines: LineString[] = [{
      "type": "LineString",
      "coordinates": [[-100, 40], [-105, 45], [-110, 55]]
    }, {
      "type": "LineString",
      "coordinates": [[-105, 40], [-110, 45], [-115, 55]]
    }];

    L.geoJSON(myLines).addTo(this.map);


    var jsonFeature: Feature = {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "coordinates": [
          [
            58.083601121350824,
            39.94962115279381
          ],
          [
            95.56436967478044,
            38.587397505384104
          ],
          [
            92.36254525602521,
            4.778078695907112
          ],
          [
            59.17773551409445,
            6.152578285925088
          ],
          [
            57.32726544465723,
            39.45359018584065
          ]
        ],
        "type": "LineString"
      }
    };
    L.geoJSON(jsonFeature).addTo(this.map);
    
 */
