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

func streamPublish(ctx context.Context, nc *nats.Conn, js jetstream.JetStream, ch chan string) {

	for s := range ch {
		if nc.Status() != nats.CONNECTED {
			continue
		}
		//fmt.Println("Received on streamPublish", s)
		//TODO: Investigate it publishes 1 message sometimes and errors out.
		//_, err := js.Publish(ctx, "hello.lat", []byte(s))
		//_, err := js.PublishAsync("hello.lat", []byte(s))

		//NC PUBLISH works best without any flaws
		nc.Publish("hello.lat", []byte(s))

		/*
			if err != nil {
				//Do nothing now
				fmt.Println("Error on Publish", err)
			}*/
	}
}

func consume_routine(cons jetstream.Consumer, ch chan string) {
	i := 0
	j := 1
	fmt.Println("Started consuming")
	start := time.Now()
	wg := sync.WaitGroup{}

	// Consumer using nats pub adsb.TejasMK1 "{jet: Tejas MK1A, Bearing: {{.Count}}}" --count 500000
	wg.Add(1)
	cons.Consume(func(msg jetstream.Msg) {
		msg.Ack()
		/*1 Millionth in time -> 48.119924156s with this print*/
		data := string(msg.Data())
		ch <- data

		//fmt.Println("Received msg on ", msg.Subject(), data)
		i++
		//wg.Done()
		if i == j {
			j = j + 100000
			if i == 1000001 {
				fmt.Println("----------------------1 MILLION events processed---------------------")
			}
			fmt.Printf("%d in time ->", i)
			fmt.Println(time.Since(start))
			fmt.Println("Ramdom sampler data...", string(msg.Data()))
		}

	})
	wg.Wait()
}

func init_rsocket_setup() {

}

func setup_rsocket(cli rsocket.Client) {
	// Connect to server
	// Send request

	result, err := cli.RequestResponse(payload.NewString("Hello World Payload from Golang", "Some payload")).Block(context.Background())
	if err != nil {
		panic(err)
	}
	log.Println("response:", result.DataUTF8())
}

// nats pub orders.us "Hi orders.us arriving" --count 10000
func infiniteStream() {
	fmt.Println("Hello World infinite consumer")

	cli, err := rsocket.Connect().
		SetupPayload(payload.NewString("golang:service", "Hello World from Golang")).
		//SetupPayload(payload.NewString("Hello", "World")).
		Transport(rsocket.TCPClient().SetHostAndPort("127.0.0.1", 6565).Build()).
		Start(context.Background())
	if err != nil {
		panic(err)
	}
	defer cli.Close()

	setup_rsocket(cli)

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

	fmt.Println("Prepare to Consume")
	/*
		wg := sync.WaitGroup{}
		wg.Add(1)
	*/
	fmt.Println("Start Consume")

	consume_routine(cons, ch)

	fmt.Println("Complete consume")
	//wg.Wait()
	fmt.Println("Wg Wait")
	//cc.Stop()
	fmt.Println("cc Stop")
	runtime.Goexit()
	fmt.Println("GOExit")
}
