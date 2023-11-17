import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { NatsConnection, StringCodec, Subscription, connect } from 'nats.ws';

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
    console.log("Connected to Nats using ",this.conn)
    this.conn.publish("hello.sue", sc.encode("ANGULAR published from Leaflet app."));
    this.conn.publish("hello.SATYA", sc.encode("Satya says hello."));

  }

  async printMessages(){
    const sc = StringCodec();

    const s = this.conn?.subscribe("hello.*");

    for await (const msg of s) {
      console.log("Received message on Nats channel");
      //s?.getProcessed(), 
      console.log("Received  ----> ",sc.decode(msg.data));
    }
  }
  

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void{
    this.map = L.map('map', {
      center: [8.16, 114.111],
      zoom: 3
    })

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    tiles.addTo(this.map);
    this.map.setZoom(3);

  }
}
