package services

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
)

type OpenAIService struct {
    apiKey     string
    model      string
    apiBaseURL string
}

type ChatMessage struct {
    Role    string `json:"role"`
    Content string `json:"content"`
}

type ChatCompletionRequest struct {
    Model    string        `json:"model"`
    Messages []ChatMessage `json:"messages"`
    Stream   bool         `json:"stream"`
}

type ChatCompletionResponse struct {
    ID      string `json:"id"`
    Object  string `json:"object"`
    Created int64  `json:"created"`
    Choices []struct {
        Delta struct {
            Content string `json:"content"`
        } `json:"delta"`
        FinishReason string `json:"finish_reason"`
    } `json:"choices"`
}

func NewOpenAIService() *OpenAIService {
    return &OpenAIService{
        apiKey:     os.Getenv("OPENAI_API_KEY"),
        model:      "gpt-3.5-turbo",
        apiBaseURL: "https://api.openai.com/v1",
    }
}

func (s *OpenAIService) StreamChatCompletion(messages []ChatMessage) (*http.Response, error) {
    reqBody := ChatCompletionRequest{
        Model:    s.model,
        Messages: messages,
        Stream:   true,
    }

    jsonData, err := json.Marshal(reqBody)
    if err != nil {
        return nil, fmt.Errorf("failed to marshal request: %v", err)
    }

    req, err := http.NewRequest("POST", fmt.Sprintf("%s/chat/completions", s.apiBaseURL), bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %v", err)
    }

    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.apiKey))
    req.Header.Set("Accept", "text/event-stream")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, fmt.Errorf("failed to send request: %v", err)
    }

    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        resp.Body.Close()
        return nil, fmt.Errorf("OpenAI API error: %s, %s", resp.Status, string(body))
    }

    return resp, nil
}
