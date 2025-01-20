package models

type Message struct {
    Role    string `json:"role"`
    Content string `json:"content"`
}

type Conversation struct {
    ID        string    `json:"id"`
    Messages  []Message `json:"messages"`
    CreatedAt int64     `json:"created_at"`
}

var Conversations = make(map[string]*Conversation)