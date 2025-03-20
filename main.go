package main

import "fmt"

func sort(arr []int) {
	for i := 0; i < len(arr); i++ {
		for j := 0; j < len(arr)-1; j++ {
			if arr[j] > arr[j+1] {
				arr[i+1], arr[j] = arr[j], arr[j+1]
			}
		}
	}
}

func sort2(arr []int) {
	for i := 0; i < len(arr); i++ {
		for j := 0; j < len(arr)-1; j++ {
			if arr[j] > arr[j+1] {
				arr[i+1], arr[j] = arr[j], arr[j+1]
			}
		}
	}
}

func main() {
	var a []int
	a = []int{1, 2, 3, 4, 5}
	sort2(a)
	fmt.Println(a)
	fmt.Sprintf("Hello Worle%s %d", b)
}
