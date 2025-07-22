"use client"

import { useState, useRef, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

import { Search, Star, Users, Clock, Filter, Sparkles, Send, Bot, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

// Mock application data
const mockApplications = [
  {
    id: 1,
    applicant: {
      firstName: "Sarah",
      lastName: "Chen",
      email: "sarah.chen@student.unsw.edu.au",
      zid: "z5234567",
      year: "3rd Year",
      degree: "Computer Science",
      phone: "+61 412 345 678",
    },
    appliedRoles: ["marketing", "design"],
    rolePreferences: { marketing: 1, design: 2 },
    motivation:
      "I'm passionate about technology and want to help DevSoc grow its community. I have experience in social media marketing from my internship at a startup, and I love creating engaging content that resonates with tech students.",
    roleAnswers: {
      marketing: {
        marketing_experience:
          "I managed social media accounts for a tech startup during my internship, growing their Instagram following by 300% in 3 months. I also created content for LinkedIn and Twitter.",
        campaign_idea:
          "I would create a 'Code & Coffee' series featuring weekly posts about different programming languages, paired with coffee shop recommendations near campus. This would combine our tech focus with student lifestyle content.",
      },
      design: {
        design_portfolio: "https://sarahchen.design",
        brand_vision:
          "I would modernize DevSoc's visual identity with a more vibrant color palette and contemporary typography while maintaining the professional tech aesthetic.",
      },
    },
    submittedAt: "2024-02-25T10:30:00Z",
    status: "pending",
    rating: null,
    reviewComment: "",
    reviewedBy: null,
    reviewedAt: null,
  },
  {
    id: 2,
    applicant: {
      firstName: "Marcus",
      lastName: "Johnson",
      email: "marcus.johnson@student.unsw.edu.au",
      zid: "z5345678",
      year: "2nd Year",
      degree: "Software Engineering",
      phone: "+61 423 456 789",
    },
    appliedRoles: ["events", "education"],
    rolePreferences: { events: 1, education: 2 },
    motivation:
      "I want to contribute to the tech community at UNSW by organizing events that bring students and industry together. I believe in the power of hands-on learning and networking.",
    roleAnswers: {
      events: {
        event_experience:
          "I organized a hackathon for my high school with 50+ participants. I also helped coordinate orientation week activities for my college.",
        event_type:
          "I would love to organize industry networking nights where students can meet professionals from different tech companies and learn about career paths.",
      },
      education: {
        teaching_experience:
          "I tutor first-year programming students and have been a mentor in the UNSW mentoring program for 2 years.",
        workshop_topic:
          "Introduction to Git and GitHub - teaching students version control fundamentals through hands-on exercises and real project scenarios.",
      },
    },
    submittedAt: "2024-02-24T14:15:00Z",
    status: "reviewed",
    rating: 4,
    reviewComment: "Strong experience in event organization and teaching. Good understanding of what students need.",
    reviewedBy: "admin@devsoc.com",
    reviewedAt: "2024-02-26T09:00:00Z",
  },
  {
    id: 3,
    applicant: {
      firstName: "Emily",
      lastName: "Rodriguez",
      email: "emily.rodriguez@student.unsw.edu.au",
      zid: "z5456789",
      year: "4th Year",
      degree: "Computer Science & Business",
      phone: "+61 434 567 890",
    },
    appliedRoles: ["industry"],
    rolePreferences: { industry: 1 },
    motivation:
      "With my business background and tech skills, I want to bridge the gap between DevSoc and industry partners. I'm passionate about creating opportunities for students to connect with potential employers.",
    roleAnswers: {
      industry: {
        networking_experience:
          "I've attended multiple tech conferences and have connections at Google, Atlassian, and several startups through my internships and networking events.",
        partnership_idea:
          "Create a 'DevSoc Industry Mentorship Program' where professionals mentor students on real projects, providing both learning opportunities and potential recruitment pipelines for companies.",
      },
    },
    submittedAt: "2024-02-23T16:45:00Z",
    status: "pending",
    rating: null,
    reviewComment: "",
    reviewedBy: null,
    reviewedAt: null,
  },
]

const roleNames = {
  marketing: "Marketing Director",
  events: "Events Coordinator",
  education: "Education Lead",
  industry: "Industry Liaison",
  design: "Design Director",
}

// Mock AI chat messages
const initialAIMessages = [
  {
    role: "assistant",
    content:
      "Hello! I'm your AI assistant for application review. I can help you evaluate candidates, compare applications, and make selection decisions. What would you like to do?",
  },
]

export default function AdminDashboard() {
  const [applications, setApplications] = useState(mockApplications)
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [rating, setRating] = useState<number>(0)
  const [reviewComment, setReviewComment] = useState("")

  // AI Chat States
  const [showAIChat, setShowAIChat] = useState(false)
  const [aiMessages, setAiMessages] = useState(initialAIMessages)
  const [currentMessage, setCurrentMessage] = useState("")
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [selectedApplicationsForAI, setSelectedApplicationsForAI] = useState<number[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    const matchesRole = selectedRole === "all" || app.appliedRoles.includes(selectedRole)
    const matchesStatus = selectedStatus === "all" || app.status === selectedStatus
    const matchesSearch =
      searchTerm === "" ||
      `${app.applicant.firstName} ${app.applicant.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant.zid.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesRole && matchesStatus && matchesSearch
  })

  const handleReviewSubmit = () => {
    if (!selectedApplication || rating === 0) return

    setApplications((prev: any) =>
      prev.map((app: { id: any }) =>
        app.id === selectedApplication.id
          ? {
              ...app,
              status: "reviewed",
              rating,
              reviewComment,
              reviewedBy: "admin@devsoc.com",
              reviewedAt: new Date().toISOString(),
            }
          : app,
      ),
    )

    setSelectedApplication(null)
    setRating(0)
    setReviewComment("")
  }

  const openReviewDialog = (application: any) => {
    setSelectedApplication(application)
    setRating(application.rating || 0)
    setReviewComment(application.reviewComment || "")
  }

  // AI Chat Functions
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [aiMessages])

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return

    // Add user message to chat
    setAiMessages((prev) => [...prev, { role: "user", content: currentMessage }])
    setCurrentMessage("")
    setIsAiThinking(true)

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(currentMessage, selectedApplicationsForAI)
      setAiMessages((prev) => [...prev, { role: "assistant", content: aiResponse }])
      setIsAiThinking(false)
    }, 1500)
  }

  const generateAIResponse = (message: string, applicationIds: number[]) => {
    const selectedApps = applications.filter((app) => applicationIds.includes(app.id))
    const messageLC = message.toLowerCase()

    // Simple pattern matching for demo purposes
    if (messageLC.includes("compare") || messageLC.includes("which is better")) {
      if (selectedApps.length < 2) {
        return "Please select at least two applications to compare. You can do this by checking the boxes next to the applications you want to analyze."
      }

      return `Based on my analysis of the selected applications:

${selectedApps
  .map(
    (app, index) =>
      `${index + 1}. ${app.applicant.firstName} ${app.applicant.lastName} (${app.appliedRoles
        .map((r) => roleNames[r as keyof typeof roleNames])
        .join(", ")}):
   - Strengths: ${getRandomStrength(app)}
   - Areas for improvement: ${getRandomWeakness()}
   - Fit score: ${Math.floor(Math.random() * 3) + 7}/10`,
  )
  .join("\n\n")}

Overall recommendation: ${
        selectedApps.length > 0
          ? `${selectedApps[0].applicant.firstName} ${selectedApps[0].applicant.lastName} appears to be the strongest candidate for ${
              roleNames[selectedApps[0].appliedRoles[0] as keyof typeof roleNames]
            } based on their relevant experience and motivation.`
          : "No clear standout candidate. Consider conducting interviews to learn more about their potential."
      }`
    }

    if (messageLC.includes("best candidate") || messageLC.includes("top candidate")) {
      const roleMatch = messageLC.match(/for\s+(\w+)/i)
      const roleToCheck = roleMatch ? roleMatch[1].toLowerCase() : null

      const relevantApps = roleToCheck
        ? applications.filter((app) => app.appliedRoles.some((r) => r.toLowerCase().includes(roleToCheck)))
        : applications

      if (relevantApps.length === 0) {
        return `I couldn't find any candidates specifically for "${roleToCheck}". Please check the role name or view all candidates.`
      }

      // Sort by a random "score" for demo purposes
      const sortedApps = [...relevantApps].sort(() => Math.random() - 0.5).slice(0, 3)

      return `Based on my analysis, here are the top candidates${roleToCheck ? ` for ${roleToCheck}` : ""}:

${sortedApps
  .map(
    (app, index) =>
      `${index + 1}. ${app.applicant.firstName} ${app.applicant.lastName}
   - Applied for: ${app.appliedRoles.map((r) => roleNames[r as keyof typeof roleNames]).join(", ")}
   - Key strength: ${getRandomStrength(app)}
   - Overall score: ${Math.floor(Math.random() * 2) + 8}/10`,
  )
  .join("\n\n")}

I recommend focusing on these candidates for the next round of interviews.`
    }

    if (messageLC.includes("analyze") || messageLC.includes("evaluate")) {
      if (selectedApps.length === 0) {
        return "Please select at least one application to analyze by checking the box next to it."
      }

      const app = selectedApps[0]
      return `Analysis of ${app.applicant.firstName} ${app.applicant.lastName}'s application:

Background: ${app.applicant.year} student in ${app.applicant.degree}

Applied roles: ${app.appliedRoles.map((r) => roleNames[r as keyof typeof roleNames]).join(", ")}

Strengths:
- ${getRandomStrength(app)}
- Strong academic background in ${app.applicant.degree}
- ${
        app.appliedRoles.includes("marketing")
          ? "Demonstrated marketing experience with measurable results"
          : app.appliedRoles.includes("events")
            ? "Previous event organization experience"
            : "Good communication skills evident in application responses"
      }

Areas for development:
- ${getRandomWeakness()}
- Could benefit from more specific examples in responses

Role fit:
${app.appliedRoles
  .map(
    (role) =>
      `- ${roleNames[role as keyof typeof roleNames]}: ${Math.floor(Math.random() * 3) + 7}/10 fit based on experience and answers`,
  )
  .join("\n")}

Recommendation: ${Math.random() > 0.5 ? "Advance to interview stage" : "Consider for interview if other candidates decline"}`
    }

    // Default responses
    const defaultResponses = [
      "I can help you evaluate applications more efficiently. Try asking me to compare candidates, analyze specific applications, or recommend the best fit for a particular role.",
      "Would you like me to analyze the strengths and weaknesses of the selected applications? Or I can help you compare candidates for a specific role.",
      "I notice you have several pending applications. Would you like me to help prioritize which ones to review first?",
      "I can provide insights on candidates based on their responses and experience. Select applications you'd like me to analyze and ask specific questions.",
    ]

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  const getRandomStrength = (app: any) => {
    const strengths = [
      `Extensive experience in ${app.appliedRoles[0]} demonstrated through previous roles`,
      "Clear communication skills evident in application responses",
      "Strong motivation aligned with DevSoc's mission",
      "Creative ideas for improving society operations",
      "Relevant technical skills for the applied position",
      "Demonstrated leadership in previous roles",
    ]
    return strengths[Math.floor(Math.random() * strengths.length)]
  }

  const getRandomWeakness = () => {
    const weaknesses = [
      "Limited specific examples in some responses",
      "Could benefit from more technical experience",
      "Relatively brief answers to some key questions",
      "May need mentoring in specific areas of responsibility",
      "Time management could be a concern given other commitments",
      "Limited evidence of long-term planning skills",
    ]
    return weaknesses[Math.floor(Math.random() * weaknesses.length)]
  }

  const toggleApplicationSelection = (appId: number) => {
    setSelectedApplicationsForAI((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId],
    )
  }

  const handleMarkWithAI = () => {
    setShowAIChat(true)
    // If applications are selected, add a contextual message
    if (selectedApplicationsForAI.length > 0) {
      const selectedApps = applications.filter((app) => selectedApplicationsForAI.includes(app.id))
      const appNames = selectedApps.map((app) => `${app.applicant.firstName} ${app.applicant.lastName}`).join(", ")

      setAiMessages([
        ...initialAIMessages,
        {
          role: "assistant",
          content: `I see you've selected ${selectedApplicationsForAI.length} application(s): ${appNames}. What would you like to know about these candidates?`,
        },
      ])
    } else {
      setAiMessages(initialAIMessages)
    }
  }

  return (
    <div className="min-h-screen w-full">
      

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Application Review Dashboard</h1>
            <p className="text-gray-600 mt-2">Review and rate applications for DevSoc Executive Recruitment 2024</p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <a href="/admin/interviews">Manage Interviews</a>
            </Button>
            <Button
              onClick={handleMarkWithAI}
              className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Mark with AI
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{applications.length}</p>
                  <p className="text-sm text-gray-600">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{applications.filter((app) => app.status === "pending").length}</p>
                  <p className="text-sm text-gray-600">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{applications.filter((app) => app.status === "reviewed").length}</p>
                  <p className="text-sm text-gray-600">Reviewed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search Applicants</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Name, email, or zID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="role">Filter by Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="marketing">Marketing Director</SelectItem>
                    <SelectItem value="events">Events Coordinator</SelectItem>
                    <SelectItem value="education">Education Lead</SelectItem>
                    <SelectItem value="industry">Industry Liaison</SelectItem>
                    <SelectItem value="design">Design Director</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Filter by Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRole("all")
                    setSelectedStatus("all")
                    setSearchTerm("")
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        checked={selectedApplicationsForAI.includes(application.id)}
                        onChange={() => toggleApplicationSelection(application.id)}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">
                          {application.applicant.firstName} {application.applicant.lastName}
                        </h3>
                        <Badge variant={application.status === "reviewed" ? "default" : "secondary"}>
                          {application.status === "reviewed" ? "Reviewed" : "Pending"}
                        </Badge>
                        {application.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{application.rating}/5</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Contact</p>
                          <p className="font-medium">{application.applicant.email}</p>
                          <p className="text-sm text-gray-600">{application.applicant.zid}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Academic Info</p>
                          <p className="font-medium">{application.applicant.degree}</p>
                          <p className="text-sm text-gray-600">{application.applicant.year}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Applied Roles</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {application.appliedRoles.map((roleId) => (
                              <Badge key={roleId} variant="outline" className="text-xs">
                                {roleNames[roleId as keyof typeof roleNames]} (#{(application.rolePreferences as any)[roleId]})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">{application.motivation}</p>

                      {application.reviewComment && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-600 mb-1">Review Comment:</p>
                          <p className="text-sm">{application.reviewComment}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-6">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button onClick={() => openReviewDialog(application)} className="hover:bg-gray-700">
                          {application.status === "reviewed" ? "View Review" : "Review Application"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Application Review - {application.applicant.firstName} {application.applicant.lastName}
                          </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6">
                          {/* Personal Information */}
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Name:</span> {application.applicant.firstName}{" "}
                                {application.applicant.lastName}
                              </div>
                              <div>
                                <span className="font-medium">Email:</span> {application.applicant.email}
                              </div>
                              <div>
                                <span className="font-medium">zID:</span> {application.applicant.zid}
                              </div>
                              <div>
                                <span className="font-medium">Year:</span> {application.applicant.year}
                              </div>
                              <div>
                                <span className="font-medium">Degree:</span> {application.applicant.degree}
                              </div>
                              <div>
                                <span className="font-medium">Phone:</span> {application.applicant.phone}
                              </div>
                            </div>
                          </div>

                          {/* General Motivation */}
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Why do you want to join DevSoc?</h3>
                            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{application.motivation}</p>
                          </div>

                          {/* Role-specific Answers */}
                          {application.appliedRoles.map((roleId) => (
                            <div key={roleId}>
                              <h3 className="text-lg font-semibold mb-3">
                                {roleNames[roleId as keyof typeof roleNames]} (Preference #
                                {(application.rolePreferences as any)[roleId]})
                              </h3>
                              <div className="space-y-4">
                                {Object.entries(((application.roleAnswers as any)[roleId] || {})).map(([questionId, answer]) => (
                                  <div key={questionId}>
                                    <p className="font-medium text-gray-900 mb-2">
                                      {questionId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
                                    </p>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{answer as string}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          {/* Rating and Review */}
                          <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4">Review & Rating</h3>
                            <div className="space-y-4">
                              <div>
                                <Label className="text-base font-medium">Rating (1-5 stars)</Label>
                                <div className="flex gap-2 mt-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setRating(star)}
                                      className={`w-8 h-8 ${
                                        star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                      }`}
                                    >
                                      <Star className="w-full h-full" />
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="reviewComment" className="text-base font-medium">
                                  Review Comment
                                </Label>
                                <Textarea
                                  id="reviewComment"
                                  value={reviewComment}
                                  onChange={(e) => setReviewComment(e.target.value)}
                                  placeholder="Add your review comments here..."
                                  className="mt-2"
                                />
                              </div>

                              <div className="flex gap-3">
                                <Button onClick={handleReviewSubmit} disabled={rating === 0}>
                                  {application.status === "reviewed" ? "Update Review" : "Submit Review"}
                                </Button>
                                <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No applications found matching your filters.</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* AI Chat Interface */}
      <div
        className={`fixed bottom-0 right-8 w-96 bg-white rounded-t-xl shadow-xl transition-all duration-300 ease-in-out z-50 ${
          showAIChat ? "h-[600px]" : "h-0"
        } overflow-hidden`}
      >
        {showAIChat && (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-full p-1">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-medium">Application Review Assistant</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAIChat(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="h-[480px] p-4">
              <div className="space-y-4">
                {aiMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} gap-2`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-500 text-white">
                          AI
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg p-3 max-w-[80%] ${
                        message.role === "user"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 text-gray-800 whitespace-pre-line"
                      }`}
                    >
                      {message.content}
                    </div>
                    {message.role === "user" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gray-200">You</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isAiThinking && (
                  <div className="flex justify-start gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-500 text-white">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 rounded-lg p-4 flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about applications..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button onClick={handleSendMessage} disabled={!currentMessage.trim() || isAiThinking}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {selectedApplicationsForAI.length > 0
                  ? `Analyzing ${selectedApplicationsForAI.length} selected application(s)`
                  : "Select applications to analyze by checking the boxes"}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
