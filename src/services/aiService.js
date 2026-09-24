import api from "./api"

export const aiService = {
  chat: async (message) => {
    const response = await api.post("/ai/chat", { message })
    return response.data
  },
  plan: async (payload) => {
    const response = await api.post("/ai/plan", payload)
    return response.data
  },
  history: async () => {
    const response = await api.get("/ai/history")
    return response.data
  },
  clearMemory: async () => {
    const response = await api.post("/ai/clear-memory")
    return response.data
  },
}

export default aiService
