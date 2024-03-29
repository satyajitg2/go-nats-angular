/*
 * This program starts a Go Microservice. It registers a few sample services for
 * example usage of a Request-Response in this project.
 * Streaming is done using go routine infiniteStream.
 * @author  Satyajit Singh
 */

package main

import (
	"fmt"
	"math/rand"
	"runtime"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/micro"
	"gorm.io/driver/clickhouse"
	"gorm.io/gorm"
)

type LatLng struct {
	Lat int
	Lng int
}
type User struct {
	Name string
	Age  int
	Lat  int
	Lng  int
}

func ConnectClickHouse() *gorm.DB {
	dsn := "clickhouse://default:@localhost:9000,127.0.0.1:9000/default?dial_timeout=200ms&max_execution_time=60"

	db, err := gorm.Open(clickhouse.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	return db
}

func usingGormBasic(db *gorm.DB) {
	// Auto Migrate
	db.AutoMigrate(&User{})
	// Set table options
	db.Set("gorm:table_options", "ENGINE=Distributed(cluster, default, hits)").AutoMigrate(&User{})
	// Set table cluster options
	db.Set("gorm:table_cluster_options", "on cluster default").AutoMigrate(&User{})
	lt, lng := getRandomLatLng()
	lntLngV := &LatLng{Lat: lt, Lng: lng}
	db.Create(&User{Name: "Angeliz", Age: 18, Lng: lntLngV.Lng, Lat: lntLngV.Lat})
	db.Find(&User{}, "name = ?", "Angeliz")
	lt, lng = getRandomLatLng()
	lntLngV = &LatLng{Lat: lt, Lng: lng}
	user1 := User{Age: 12, Name: "Bruce Lee", Lng: lntLngV.Lng, Lat: lntLngV.Lat}
	lt, lng = getRandomLatLng()
	lntLngV = &LatLng{Lat: lt, Lng: lng}

	user2 := User{Age: 13, Name: "Feynman", Lng: lntLngV.Lng, Lat: lntLngV.Lat}
	lt, lng = getRandomLatLng()
	lntLngV = &LatLng{Lat: lt, Lng: lng}

	user3 := User{Age: 14, Name: "Angeliz", Lng: lntLngV.Lng, Lat: lntLngV.Lat}
	var users = []User{user1, user2, user3}
	db.Create(&users)
	items, _ := db.Table("users").Rows()

	for items.Next() {
		var user User
		// ScanRows is a method of `gorm.DB`, it can be used to scan a row into a struct
		db.ScanRows(items, &user)
	}
}

func getRandomLatLng() (int, int) {
	lng := rand.Intn(180)
	lat := rand.Intn(90)

	return lat, lng
}

func main() {
	nc, _ := nats.Connect(nats.DefaultURL)
	db := ConnectClickHouse() //WHEN Hello Micro starts setup a DB connection
	echoHandler := func(req micro.Request) {
		fmt.Println(req.Data())
		slice1 := req.Data()
		slice := append([]byte("Server ECHO "))
		slice = append(slice, slice1...)

		//Make clickhouse DB call
		//runQuery()
		//Setup Go Conn
		usingGormBasic(db)

		req.Respond(slice)
	}

	requestHandler := func(req micro.Request) {
		fmt.Println(req.Data())
		slice1 := req.Data()
		slice := append([]byte("Server says Hello "))
		slice = append(slice, slice1...)
		fmt.Println(slice)
		req.Respond(slice)
	}

	//	fmt.Printf("requestHandler: %v\n", requestHandler)

	srv, err := micro.AddService(nc, micro.Config{
		Name:    "EchoService",
		Version: "1.0.0",
		//base handler
		Endpoint: &micro.EndpointConfig{
			Subject: "svc.echo",
			Handler: micro.HandlerFunc(echoHandler),
		},
	})

	micro.AddService(nc, micro.Config{
		Name:    "HelloService",
		Version: "1.0.0",
		//base handler
		Endpoint: &micro.EndpointConfig{
			Subject: "svc.hello",
			Handler: micro.HandlerFunc(requestHandler),
		},
	})

	//TODO: Setup infinite consumer right away.
	go infiniteStream()
	fmt.Println(srv, err)

	runtime.Goexit()
}

/*
func connect() (driver.Conn, error) {
	var (
		ctx       = context.Background()
		conn, err = clickhouse.Open(&clickhouse.Options{
			Addr: []string{"localhost:9000"},
			Auth: clickhouse.Auth{
				Database: "nats",
				Username: "default",
				Password: "",
			},
			ClientInfo: clickhouse.ClientInfo{
				Products: []struct {
					Name    string
					Version string
				}{
					{Name: "an-example-go-client", Version: "0.1"},
				},
			},
			Debugf: func(format string, v ...interface{}) {
				fmt.Printf(format, v)
			},
			//TLS is not needed now
		})
	)

	if err != nil {
		return nil, err
	}

	if err := conn.Ping(ctx); err != nil {
		if exception, ok := err.(*clickhouse.Exception); ok {
			fmt.Printf("Exception [%d] %s \n%s\n", exception.Code, exception.Message, exception.StackTrace)
		}
		return nil, err
	}
	return conn, nil
}

func runQuery() {
	conn, err := connect()
	if err != nil {
		fmt.Println("Failed to connect : ", err)
	}
	ctx := context.Background()
	rows, err := conn.Query(ctx, "select * from clickhouse_table")
	if err != nil {
		log.Fatal(err)
	}

	for rows.Next() {
		var (
			user_id   uint32
			message   string
			timestamp time.Time
			metric    float32
		)
		if err := rows.Scan(
			&user_id,
			&message,
			&timestamp,
			&metric,
		); err != nil {
			log.Fatal(err)
		}
		log.Printf("user_id: %s, message: %s, timestamp: %s, metric: %s",
			user_id, message, &timestamp, metric)
	}
}
*/
