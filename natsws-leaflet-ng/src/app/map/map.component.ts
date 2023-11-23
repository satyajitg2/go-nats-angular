import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { NatsConnection, StringCodec, Subscription, connect } from 'nats.ws';
import { Feature } from 'geojson';
import { LineString } from 'geojson';


@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})


export class MapComponent implements AfterViewInit {

  map: L.Map | undefined;
  conn: NatsConnection | any;
  sub: any;
  circle: L.Circle<any> | undefined;
  unitsGeoJson: L.GeoJSON;
  

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

    this.printMessages();
    this.geoJsonMessage();
    
    console.log("Connected to Nats using ",this.conn)
    this.conn.publish("hello.nats_server", sc.encode("Nats ws UI says hello"));

  }

  async geoJsonMessage() {
    const sc = StringCodec();
    const s = this.conn.subscribe("geojson.feature");
    for await(const msg of s) {
      const geoJsonData = sc.decode(msg.data);
      console.log("GEOJSON message received", geoJsonData);
    }
  }

  async printMessages(){
    const sc = StringCodec();
    const longBounds = -80;
    const latBounds = -45;

    //COMAMND to launch streaming
    //nats -s ws://localhost:8080 req 'hello.lat' {{.Count}} --count 5000

    //This nats cli streaming simulates latitude variation for the circle marker
    //which updates on frontend like a moving circle
    //TODO: Frontend is unable to keepup with streams and keeps moving the circle
    //until entire stream is consumed
    const s = this.conn?.subscribe("hello.lat");

    for await (const msg of s) {
      var latVar = latBounds; //0-90
      var lngVar = longBounds; //0-180
      
      latVar = latVar+ (parseInt(sc.decode(msg.data))/100);
      lngVar = lngVar+ (parseInt(sc.decode(msg.data))/100);
      console.log("msg.data", parseInt(sc.decode(msg.data)));

      if(latVar > 80) {
        latVar = latBounds;
      }
      if(lngVar > 99) {
        lngVar = longBounds;
      }

      console.log(latVar, lngVar);
      this.map?.setView(L.latLng(latVar, lngVar))
      
      this.circle?.setLatLng(L.latLng(latVar, lngVar));
    }
  }
  

  ngAfterViewInit(): void {
    this.initMap();
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

    var geojsonFeature: Feature = {
      "type": "Feature",
      "properties": {
          "name": "Coors Field",
          "amenity": "Baseball Stadium",
          "popupContent": "This is where the Rockies play!"
      },
      "geometry": {
          "type": "Point",
          "coordinates": [40, 79]
      }
    };

    L.geoJSON(geojsonFeature).addTo(this.map);

    //Add Geojson Lines
    var myLines: LineString[] = [{
      "type": "LineString",
      "coordinates": [[-100, 40], [-105, 45], [-110, 55]]
    }, {
      "type": "LineString",
      "coordinates": [[-105, 40], [-110, 45], [-115, 55]]
    }];


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

    L.geoJSON(myLines).addTo(this.map);
    L.geoJSON(jsonFeature).addTo(this.map);

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
  }
}
