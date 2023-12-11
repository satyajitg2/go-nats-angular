package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"runtime"
	"sync"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rsocket/rsocket-go"
	"github.com/rsocket/rsocket-go/payload"
)

func requestResponse_rsocket(cli rsocket.Client) {
	result, err := cli.RequestResponse(payload.NewString("Hello World Payload from Golang", "Some payload")).Block(context.Background())
	if err != nil {
		panic(err)
	}
	log.Println("response:", result.DataUTF8())
}

func streamPublish(ctx context.Context, nc *nats.Conn, js jetstream.JetStream, ch chan string) {

	for s := range ch {
		if nc.Status() != nats.CONNECTED {
			continue
		}
		nc.Publish("hello.aircraft", []byte(s))
	}
}

func consume_routine(cons jetstream.Consumer, ch chan string) {
	fmt.Println("Ready to consume")
	wg := sync.WaitGroup{}

	//Publish using $nats pub adsb.TejasMK1 {{.Count}}} --count 500000
	wg.Add(1)
	cons.Consume(func(msg jetstream.Msg) {
		msg.Ack()
		data := string(msg.Data())
		subj := msg.Subject()
		ch <- data
		fmt.Println("Sending data --> ", string(msg.Data()), " on subject ->", subj)
	})
	wg.Wait()
}

func init_rsocket_setup() {

}

// $nats pub orders.us "Hi orders.us arriving" --count 10000
func infiniteStream() {
	fmt.Println("Hello World infinite consumer")
	url := os.Getenv("NATS_URL")
	if url == "" {
		url = nats.DefaultURL
	}

	nc, _ := nats.Connect(url)
	defer nc.Drain()

	js, _ := jetstream.New(nc)

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
	defer cancel()

	streamName := "ADSB"
	infiniteStream, _ := js.CreateStream(ctx, jetstream.StreamConfig{
		Name:     streamName,
		Subjects: []string{"adsb.>"},
	})

	cons, _ := infiniteStream.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{})

	//Channel consumer -->> publisher
	ch := make(chan string)
	go streamPublish(ctx, nc, js, ch)

	fmt.Println("Prepare consume Routine")
	consume_routine(cons, ch)
	runtime.Goexit()
	fmt.Println("GOExit")
}
