package main

import (
	"fmt"
	"time"
)

func main() {
	fmt.Println("Ticker started")
	ticker := time.NewTicker(time.Second)
	for t := range ticker.C {
		fmt.Println("Tick at", t)
	}
}
