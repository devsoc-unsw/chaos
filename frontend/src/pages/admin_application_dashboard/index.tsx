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

import { Search, Star, Sparkles, Bot } from "lucide-react"

// Import mock application data and role names
import mockApplications from "./mockApplications.json"
import roleNames from "./mockRoleNames.json"


export default function AdminDashboard() {
  const [applications, setApplications] = useState(mockApplications)
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [rating, setRating] = useState<number>(0)
  const [reviewComment, setReviewComment] = useState("")

  // Initialize selectedApplications from localStorage
  const [selectedApplications, setSelectedApplications] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedApplications')
      if (saved) {
        const data = JSON.parse(saved)
        // Check if data has expired (24 hours from when it was saved)
        if (data.expiresAt && new Date().getTime() > data.expiresAt) {
          localStorage.removeItem('selectedApplications')
          return []
        }
        return data.applications || []
      }
    }
    return []
  })

  // AI Modal state
  const [showAIModal, setShowAIModal] = useState(false)

  // Ensure page scroll remains active when select dropdowns are open
  useEffect(() => {
    // Force body to maintain scroll behavior
    document.body.style.overflow = 'auto'
    document.body.style.overflowY = 'scroll'

    return () => {
      document.body.style.overflow = 'auto'
      document.body.style.overflowY = 'scroll'
    }
  }, [])

  // Save selected applications to localStorage whenever it changes
  useEffect(() => {
    const data = {
      applications: selectedApplications,
      expiresAt: new Date().getTime() + (24 * 60 * 60 * 1000) // 24 hours from now
    }
    localStorage.setItem('selectedApplications', JSON.stringify(data))
  }, [selectedApplications])

  // Toggle application selection
  const toggleApplicationSelection = (appId: number) => {
    setSelectedApplications(prev =>
      prev.includes(appId)
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    )
  }

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

  const handleMarkWithAI = () => {
    setShowAIModal(true)
  }

  return (
    <div className="min-h-screen w-full">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Application Review Dashboard</h1>
            <p className="text-gray-600 mt-2">Review and rate applications for DevSoc Executive Recruitment 2025</p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="hover:bg-gray-700 text-white">
              <a href="/admin/interviews" >Manage Interviews</a>
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
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

        </div> */}

        {/* Filters */}
        <Card className="mb-8 border-gray-200">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search Applicants</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <Input
                    id="search"
                    placeholder="Name, email, or zID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="role">Filter by Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-300" position="popper" sideOffset={4}>
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
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-300">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end border-gray-300">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRole("all")
                    setSelectedStatus("all")
                    setSearchTerm("")
                  }}
                  className="w-full border-gray-300"
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
            <Card key={application.id} className="hover:shadow-md transition-shadow border-gray-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        checked={selectedApplications.includes(application.id)}
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
                                      className={`w-8 h-8 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
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
              <p className="text-gray-300">No applications found matching your filters.</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* AI Modal */}
      <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gray-300" />
              AI Assistant
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="mb-4">
                <Bot className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              </div>
              <h3 className="text-lg font-semibold mb-2 bg-gray-50 p-4 rounded-lg">tf bro, I'm watching you, do your work dum bass! 👀</h3>

            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAIModal(false)}
              >
                Close
              </Button>

            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
