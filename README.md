# go-nats-angular
leaftlet and nats jetstream

Start nats server 
satyajit@satyajit-ThinkPad-T420:~$ nats-server -c  /home/satyajit/Code/nats_conf/server.conf

server.conf
----------------------------
listen: 127.0.0.1:4222
jetstream: enabled
websocket: {
        port: 8080
        no_tls: true
}
authorization {
        default_permissions = {}
}

