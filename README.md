# go-nats-angular
leaftlet and nats jetstream


1.Start nats server 
--------------------------------
$satyajit@satyajit-ThinkPad-T420:~$ nats-server -c  go-nats-angular/nats-server.conf

2. Build and start angular app
--------------------------------
#cd natsws-leaflet-ng

$git checkout leaflet_features

#ng serve

3. Open Web App
-------------------------------
localhost:4200

4. Publish streaming data using nats CLI
--------------------------------
$nats -s ws://localhost:8080 pub 'hello.a380' {{.Count}} --count 100000  


5. Start Go streaming app
---------------------------
$cd nats_micro/micro
$go run .

$ nats pub adsb.anything {{.Count}} --count 1000000  --Publish on any nats subject eg. adsb.F1, adsb.anything, its re-routed to hello.aircraft

