package main

import (
	"fmt"
	"net/http"
	"time"
)

var (
	version string
)

func versionHandler(w http.ResponseWriter, req *http.Request) {
	fmt.Fprintf(w, "go http server: version(%s), %v\n", version, time.Now())
}

func main() {
	http.HandleFunc("/version", versionHandler)
	fmt.Println("go http server: listening on port 10086...")
	http.ListenAndServe(":10086", nil)
}
