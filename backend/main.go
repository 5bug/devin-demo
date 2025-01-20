package main

import (
    "log"
    "os"

    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    "gpt-chat-app/backend/internal/api"
    "gpt-chat-app/backend/internal/services"
)

func main() {
    if err := godotenv.Load(); err != nil {
        log.Printf("Warning: .env file not found")
    }

    r := gin.Default()

    // Configure CORS
    config := cors.DefaultConfig()
    config.AllowOrigins = []string{"http://localhost:5173"}
    config.AllowMethods = []string{"GET", "POST", "DELETE", "OPTIONS"}
    config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
    r.Use(cors.New(config))

    // Initialize services and handlers
    openaiService := services.NewOpenAIService()
    handler := api.NewHandler(openaiService)

    // API routes
    apiGroup := r.Group("/api")
    {
        // Conversation management
        apiGroup.POST("/conversations", handler.CreateConversation)
        apiGroup.DELETE("/conversations/:id", handler.RemoveConversation)
        apiGroup.GET("/conversations", handler.ListConversations)
        
        // Chat streaming
        apiGroup.POST("/conversations/:id/chat", handler.StreamChat)
    }

    port := os.Getenv("PORT")
    if port == "" {
        port = "8000"
    }

    log.Printf("Server starting on port %s", port)
    if err := r.Run(":" + port); err != nil {
        log.Fatal("Failed to start server: ", err)
    }
}
