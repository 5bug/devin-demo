package api

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "gpt-chat-app/backend/internal/models"
    "gpt-chat-app/backend/internal/services"
)

type Handler struct {
    openai *services.OpenAIService
}

func NewHandler(openai *services.OpenAIService) *Handler {
    return &Handler{
        openai: openai,
    }
}

// CreateConversation creates a new conversation
func (h *Handler) CreateConversation(c *gin.Context) {
    id := uuid.New().String()
    conversation := &models.Conversation{
        ID:        id,
        Messages:  []models.Message{},
        CreatedAt: time.Now().Unix(),
    }
    models.Conversations[id] = conversation
    c.JSON(http.StatusCreated, conversation)
}

// RemoveConversation removes a conversation by ID
func (h *Handler) RemoveConversation(c *gin.Context) {
    id := c.Param("id")
    if _, exists := models.Conversations[id]; !exists {
        c.JSON(http.StatusNotFound, gin.H{"error": "conversation not found"})
        return
    }
    delete(models.Conversations, id)
    c.Status(http.StatusNoContent)
}

// ListConversations returns all conversations
func (h *Handler) ListConversations(c *gin.Context) {
    conversations := make([]*models.Conversation, 0, len(models.Conversations))
    for _, conv := range models.Conversations {
        conversations = append(conversations, conv)
    }
    c.JSON(http.StatusOK, conversations)
}

// StreamChat handles streaming chat completion
func (h *Handler) StreamChat(c *gin.Context) {
    id := c.Param("id")
    conversation, exists := models.Conversations[id]
    if !exists {
        c.JSON(http.StatusNotFound, gin.H{"error": "conversation not found"})
        return
    }

    var req struct {
        Message string `json:"message"`
    }
    if err := c.BindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
        return
    }

    // Add user message to conversation
    userMsg := models.Message{
        Role:    "user",
        Content: req.Message,
    }
    conversation.Messages = append(conversation.Messages, userMsg)

    // Convert conversation messages to OpenAI format
    messages := make([]services.ChatMessage, len(conversation.Messages))
    for i, msg := range conversation.Messages {
        messages[i] = services.ChatMessage{
            Role:    msg.Role,
            Content: msg.Content,
        }
    }

    // Set headers for SSE
    c.Header("Content-Type", "text/event-stream")
    c.Header("Cache-Control", "no-cache")
    c.Header("Connection", "keep-alive")

    // Stream the response
    resp, err := h.openai.StreamChatCompletion(messages)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("OpenAI error: %v", err)})
        return
    }
    defer resp.Body.Close()

    // Create a channel to signal when the client disconnects
    clientGone := c.Writer.CloseNotify()

    // Start streaming
    decoder := json.NewDecoder(resp.Body)
    assistantMessage := models.Message{Role: "assistant", Content: ""}

    c.Stream(func(w io.Writer) bool {
        select {
        case <-clientGone:
            return false
        default:
            var chunk struct {
                Choices []struct {
                    Delta struct {
                        Content string `json:"content"`
                    } `json:"delta"`
                    FinishReason *string `json:"finish_reason"`
                } `json:"choices"`
            }

            if err := decoder.Decode(&chunk); err != nil {
                return false
            }

            if len(chunk.Choices) > 0 {
                content := chunk.Choices[0].Delta.Content
                assistantMessage.Content += content

                // Send the chunk to the client
                c.SSEvent("message", gin.H{"content": content})
                return true
            }

            return false
        }
    })

    // Add the complete assistant message to the conversation
    if assistantMessage.Content != "" {
        conversation.Messages = append(conversation.Messages, assistantMessage)
    }
}
