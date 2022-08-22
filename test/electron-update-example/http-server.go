package main

import (
	"fmt"
	"net"
	"net/http"
	"time"
)

var (
	version string
)

type myHandler struct{}

func (t *myHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "go http server: version(%s), %v\n", version, time.Now())
}

func main() {
	l, err := net.Listen("tcp", "localhost:10086")
	if err != nil {
		panic(err)
	}
	fmt.Println("go http server: listening on port 10086...")

	h := new(myHandler)
	if err := http.Serve(l, h); err != nil {
		panic(err)
	}
}
