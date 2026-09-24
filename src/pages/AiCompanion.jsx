import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { aiService } from "../services/api"

const suggestedPrompts = [
  "Plan a 3-day trip to Manali for a budget-friendly adventure",
  "Make the itinerary cheaper and add nightlife",
  "Suggest peaceful mountain destinations near Delhi",
  "Replace trekking with sightseeing and add food recommendations",
  "Explain a difficult topic in simple terms",
]

export default function AiCompanion() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [error, setError] = useState("")
  const [itinerary, setItinerary] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      navigate("/login")
      return
    }

    try {
      const user = JSON.parse(storedUser)
      setUsername(user.username)
      setMessages([
        {
          role: "assistant",
          content: "I’m Safarnama AI. Ask me about travel, planning, explanations, writing, coding, or any other topic.",
        },
      ])
    } catch (e) {
      navigate("/login")
    }
  }, [navigate])

  const sendMessage = async (messageText = draft) => {
    if (!messageText?.trim()) return

    const trimmed = messageText.trim()
    setDraft("")
    setMessages((prev) => [...prev, { role: "user", content: trimmed }])
    setLoading(true)
    setError("")

    try {
      const response = await aiService.chat(trimmed)
      const assistantMessage = response?.answer || "I couldn’t craft a reply right now."
      setMessages((prev) => [...prev, { role: "assistant", content: assistantMessage }])
      setHistory(response?.history || [])
      if (response?.citations?.length) {
        setItinerary({
          title: "Suggested references",
          citations: response.citations,
        })
      }
    } catch (err) {
      setError(err?.message || "Unable to reach the AI companion right now.")
    } finally {
      setLoading(false)
    }
  }

  const clearMemory = async () => {
    try {
      await aiService.clearMemory()
      setMessages([
        {
          role: "assistant",
          content: "Conversation memory cleared. I’ll treat this as a fresh planning session.",
        },
      ])
      setItinerary(null)
      setHistory([])
    } catch (err) {
      setError(err?.message || "Unable to clear memory.")
    }
  }

  const summary = useMemo(() => {
    return history.slice(-4).map((entry) => entry.content || "")
  }, [history])

  return (
    <div className="min-height-screen">
      <Navbar isLoggedIn={true} username={username} />
      <div className="main-content">
        <div className="container section">
          <div className="dashboard-grid">
            <div className="dashboard-main">
              <div className="card mb-4">
                <div className="card-body">
                  <div className="d-flex justify-between align-center mb-3">
                    <div>
                      <h2 className="section-title mb-1">Safarnama AI</h2>
                      <p className="text-muted">Ask anything. Travel answers can also use relevant Safarnama blog context.</p>
                    </div>
                    <button className="btn btn-secondary" onClick={clearMemory}>
                      Clear Memory
                    </button>
                  </div>

                  <div className="ai-chat-window">
                    {messages.map((message, index) => (
                      <div key={index} className={`ai-message ${message.role}`}>
                        <strong>{message.role === "assistant" ? "AI" : "You"}</strong>
                        <p>{message.content}</p>
                      </div>
                    ))}
                    {loading && <div className="ai-message assistant"><strong>AI</strong><p>Thinking...</p></div>}
                  </div>

                  {error && <div className="card error-card mt-3"><p className="error-text">{error}</p></div>}

                  <div className="mt-3">
                    <textarea
                      className="form-control"
                      rows="3"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Describe your travel plan, budget, or desired changes..."
                    />
                    <div className="d-flex gap-2 mt-3 flex-wrap">
                      <button className="btn btn-primary" onClick={() => sendMessage()} disabled={loading}>
                        {loading ? "Thinking..." : "Send"}
                      </button>
                      <button className="btn btn-secondary" onClick={() => setDraft("")}>
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-muted mb-2">Suggested prompts</p>
                    <div className="genre-badges">
                      {suggestedPrompts.map((prompt) => (
                        <button key={prompt} className="btn btn-secondary" onClick={() => sendMessage(prompt)}>
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-sidebar">
              <div className="card mb-4">
                <div className="card-body">
                  <h3 className="card-title">Conversation context</h3>
                  <ul className="text-muted">
                    {summary.length > 0 ? summary.map((item, index) => <li key={index}>{item}</li>) : <li>No prior context yet.</li>}
                  </ul>
                </div>
              </div>

              {itinerary && (
                <div className="card">
                  <div className="card-body">
                    <h3 className="card-title">Blog citations</h3>
                    {itinerary.citations.map((citation) => (
                      <a key={citation.id} href={citation.url} className="d-block mb-2" target="_blank" rel="noreferrer">
                        {citation.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
