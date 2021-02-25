package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"math/rand"
	"sync"
	"time"

	MQTT "github.com/eclipse/paho.mqtt.golang"
)

// MetricMessage is used for publishing the JSON data to the metrics topic
type MetricMessage struct {
	DateTime             time.Time `json:"dateTime"`
	SoftwareVersion      string    `json:"softwareVersion"`      //  SoftwareVersion as a string
	PeerCount            int64     `json:"peerCount"`            //  PeerCount as an int65
	QueueCount           int64     `json:"queueCount"`           //  QueueCount as an int65
	BlockNumber          int64     `json:"blockNumber"`          //  BlockNumber as an int64
	BlockHash            string    `json:"blockHash"`            //  BlockHash as a string
	BlockTime            float64   `json:"blockTime"`            //  BlockTime as an int64 unix timestamp
	BlockPropagationTime int64     `json:"blockPropagationTime"` //  BlockPropagationTime as an int64 in ms
}

// Allowed letters for the random hash
var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890")

// Create a random hash
func randHash() string {
	b := make([]rune, 66)
	b[0] = '0'
	b[1] = 'x'

	for i := 2; i < 66; i++ {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}

/*
 Options:
  [-help]                      	Display help
  [-id <string>]             	Set the pattern for the cliendID
  [-broker <string>]            Set the broker URI (ws://localhost:5000/mqtt)
  [-count <int>] 				Set the node count, which should be run
  [-interval <int>] 			Set the refresh interval in seconds
*/

func main() {

	// Parse arguments
	broker := flag.String("broker", "ws://localhost/mqtt", "The broker URI (required). For example: ws://localhost/mqtt")
	id := flag.String("id", "Test Node", "The unique clientId (required). For example: Test Node")
	count := flag.Int("count", 10, "The number of instances, which should be run. For example: 1")
	interval := flag.Float64("interval", 5.123, "The interval in which the metrics are to be published in seconds. For example: 1")
	flag.Parse()

	// Output arguments
	fmt.Printf("Arguments:\n")
	fmt.Printf("\tbroker:    %s\n", *broker)
	fmt.Printf("\tclientid:  %s\n", *id)
	fmt.Printf("\tcount:  %d\n", *count)
	fmt.Printf("\tinterval:  %f\n", *interval)

	// Check arguments
	if *id == "" {
		fmt.Println("Invalid setting for -broker, must not be empty")
		return
	}
	if *broker == "" {
		fmt.Println("Invalid setting for -id, must not be empty")
		return
	}
	if *count <= 0 {
		fmt.Println("Invalid setting for -count, must be greater than zero")
		return
	}
	if *interval <= 0 {
		fmt.Println("Invalid setting for -interval, must be greater than zero")
		return
	}

	// Create a sync group to wait for all metric nodes
	var wg sync.WaitGroup

	// Example categories
	var categories = []string{"Bor Service", "Heimdall Service", "REST Server", "Heimdall Bridge"}

	// Run <count> nodes
	for i := 1; i <= *count; i++ {
		// Generate the clientId and the category for testing purposes
		clientID := fmt.Sprintf("%s - %03d", *id, i)
		category := categories[rand.Intn(len(categories))]

		// Increment the waitGroup counter so we will wait for an additional node
		wg.Add(1)

		// Run the worker
		go runNode(&wg, *broker, clientID, category, *interval)
		time.Sleep(100 * time.Millisecond)
	}

	// Wait for all nodes to finish
	wg.Wait()
}

func runNode(wg *sync.WaitGroup, broker string, id string, category string, interval float64) {
	// Decrement the waitGroup counter, when this function is finished
	defer wg.Done()

	// Initialize the MQTT broker
	opts := MQTT.NewClientOptions()
	opts.AddBroker(broker)
	opts.SetClientID(id)
	opts.SetCleanSession(false)

	client := MQTT.NewClient(opts)

Connect:
	// Connect the client, throw exception if no connection could be established
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		fmt.Println(token.Error())
		time.Sleep(5 * time.Second)
		goto Connect //Retry connect
	}

	fmt.Println("Publisher Started for " + id)

	// Create topic for this node by category and nodeId
	topic := fmt.Sprintf("metrics/categories/%s/nodes/%s", category, id)

	counter := 0
	// Infinite loop
	for {
		counter++
		// Create a test JSON message
		payload, _ := json.Marshal(MetricMessage{
			DateTime:             time.Now().UTC(),
			SoftwareVersion:      "0.1.0-alpha",
			PeerCount:            rand.Int63n(100),
			QueueCount:           rand.Int63n(100),
			BlockNumber:          int64(counter),
			BlockHash:            randHash(),
			BlockTime:            float64(interval),
			BlockPropagationTime: rand.Int63n(5000)})

		// Publish to the topic
		token := client.Publish(topic, byte(2), true, payload)
		token.Wait()

		// Wait for the specified time frame
		time.Sleep(time.Duration(interval) * time.Second)
	}
}
