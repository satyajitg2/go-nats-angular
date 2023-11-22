import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { NatsConnection, StringCodec, Subscription, connect } from 'nats.ws';

//import markerIcon from "../../../node_modules/leaflet/dist/images/marker-icon.png";
//import markerIcon from 'leaflet/dist/images/marker-icon.png'


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
  

  constructor() {
    const res = this.connectNats();
    this.natsSubscribe();
  }

  natsSubscribe() {
    //create a simple subscriber and iterate over messages
    //matching the 
    const sub = this.conn?.subscribe("hello.*");
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
    this.conn.publish("hello.sue", sc.encode("ANGULAR published from Leaflet app."));
    this.conn.publish("hello.SATYA", sc.encode("Satya says hello."));

  }

  async geoJsonMessage() {
    const s = this.conn.subscribe("geojson.feature");
    for await(const msg of s) {
      console.log("GEOJSON message received");
      //TODO: Add a geojson feature to map
      //L.geoJSON(msg)
      //this.map?.hasLayer
      this.map?.addLayer
      

    }

  }

  async printMessages(){
    const sc = StringCodec();
    const longBounds = -80;
    const latBounds = -45;

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

    //L.Icon.Default.imagePath='images/';
/*
    var marker = L.marker([23.24, 72.34], {icon: L.icon({
      iconUrl: '',
      iconSize: [80,80]

    })}).addTo(this.map);

    marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
*/
    this.circle = L.circle([24.98, 77.76], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5,
      radius: 500000
    }).addTo(this.map);
    this.circle.bindPopup("circle popup").openPopup();
  }
}
