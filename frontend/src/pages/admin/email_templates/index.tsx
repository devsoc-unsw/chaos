import { useState } from "react"
import { Link } from "react-router-dom"
import Button from "@/components/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, DocumentDuplicateIcon, ArrowLeftIcon, EnvelopeIcon, CalendarIcon, UserIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline"

// Type definitions
interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplateVariable {
  key: string;
  description: string;
  example: string;
}

interface TemplateCategory {
  value: string;
  label: string;
}

interface FormData {
  name: string;
  subject: string;
  body: string;
  category: string;
}

// Available template variables
const templateVariables: TemplateVariable[] = [
  { key: "{{name}}", description: "Applicant's full name", example: "Sarah Chen" },
  { key: "{{role}}", description: "Role applied for", example: "Marketing Director" },
  { key: "{{organisation_name}}", description: "Organization name", example: "DevSoc" },
  { key: "{{campaign_name}}", description: "Campaign name", example: "DevSoc Executive Recruitment 2024" },
  { key: "{{expiry_date}}", description: "Offer expiry date", example: "March 30, 2024" },
]

// Mock email templates
const mockTemplates: EmailTemplate[] = [
  {
    id: 1,
    name: "Interview Invitation",
    subject: "Interview Invitation - {{role}} at {{organisation_name}}",
    body: `Dear {{name}},

Congratulations! We were impressed with your application for the {{role}} position in our {{campaign_name}}.

We would like to invite you for an interview to discuss your application further. Please reply to this email with your availability for the following time slots:

- Monday, March 25th: 10:00 AM - 5:00 PM
- Tuesday, March 26th: 10:00 AM - 5:00 PM
- Wednesday, March 27th: 10:00 AM - 5:00 PM

The interview will be conducted in-person at the CSE Building, UNSW Kensington Campus, and will take approximately 30 minutes.

We look forward to meeting you!

Best regards,
{{organisation_name}} Recruitment Team`,
    category: "interview",
    createdAt: "2024-02-20T10:00:00Z",
    updatedAt: "2024-02-20T10:00:00Z",
  },
  {
    id: 2,
    name: "Application Acceptance",
    subject: "Congratulations! Offer for {{role}} at {{organisation_name}}",
    body: `Dear {{name}},

We are delighted to offer you the position of {{role}} for {{campaign_name}}!

After careful consideration of all applications and interviews, we believe you would be an excellent addition to our team. Your experience and passion for technology align perfectly with our mission.

This offer is valid until {{expiry_date}}. Please reply to this email by this date to confirm your acceptance.

Next steps:
1. Confirm your acceptance by replying to this email
2. Attend the onboarding session on April 5th, 2024
3. Complete the necessary paperwork

We're excited to have you join the {{organisation_name}} team!

Congratulations and welcome aboard!

Best regards,
{{organisation_name}} Executive Team`,
    category: "acceptance",
    createdAt: "2024-02-18T14:30:00Z",
    updatedAt: "2024-02-22T09:15:00Z",
  },
  {
    id: 3,
    name: "Application Rejection",
    subject: "Update on your {{role}} application - {{organisation_name}}",
    body: `Dear {{name}},

Thank you for your interest in the {{role}} position for {{campaign_name}} and for taking the time to submit your application.

After careful consideration of all applications, we have decided to move forward with other candidates whose experience more closely matches our current needs.

This decision was not easy, as we received many high-quality applications. We encourage you to apply for future opportunities with {{organisation_name}} as they arise.

We appreciate your interest in our organization and wish you all the best in your future endeavors.

Best regards,
{{organisation_name}} Recruitment Team`,
    category: "rejection",
    createdAt: "2024-02-19T16:45:00Z",
    updatedAt: "2024-02-19T16:45:00Z",
  },
  {
    id: 4,
    name: "Application Received",
    subject: "Application Received - {{campaign_name}}",
    body: `Dear {{name}},

Thank you for submitting your application for the {{role}} position in our {{campaign_name}}.

We have successfully received your application and our recruitment team will review it carefully. You can expect to hear back from us within the next two weeks.

Application Details:
- Position: {{role}}
- Campaign: {{campaign_name}}
- Submitted: Today

If you have any questions about your application or the recruitment process, please don't hesitate to contact us.

Thank you for your interest in {{organisation_name}}!

Best regards,
{{organisation_name}} Recruitment Team`,
    category: "confirmation",
    createdAt: "2024-02-15T11:20:00Z",
    updatedAt: "2024-02-15T11:20:00Z",
  },
]

const templateCategories: TemplateCategory[] = [
  { value: "all", label: "All Templates" },
  { value: "interview", label: "Interview" },
  { value: "acceptance", label: "Acceptance" },
  { value: "rejection", label: "Rejection" },
  { value: "confirmation", label: "Confirmation" },
  { value: "reminder", label: "Reminder" },
]

// Dummy data for preview
const previewData = {
  name: "Sarah Chen",
  role: "Marketing Director",
  organisation_name: "DevSoc",
  campaign_name: "DevSoc Executive Recruitment 2024",
  expiry_date: "March 30, 2024",
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(mockTemplates)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    subject: "",
    body: "",
    category: "interview",
  })

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    const matchesSearch =
      searchTerm === "" ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleCreateTemplate = () => {
    const newTemplate = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (editingTemplate) {
      setTemplates((prev) =>
        prev.map((template) =>
          template.id === editingTemplate.id
            ? { ...newTemplate, id: editingTemplate.id, createdAt: editingTemplate.createdAt }
            : template,
        ),
      )
      setEditingTemplate(null)
    } else {
      setTemplates((prev) => [...prev, newTemplate])
    }

    setFormData({ name: "", subject: "", body: "", category: "interview" })
    setShowCreateDialog(false)
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category,
    })
    setShowCreateDialog(true)
  }

  const handleDeleteTemplate = (templateId: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      setTemplates((prev) => prev.filter((template) => template.id !== templateId))
    }
  }

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setPreviewTemplate(template)
    setShowPreviewDialog(true)
  }

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    const duplicatedTemplate: EmailTemplate = {
      ...template,
      id: Date.now(),
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setTemplates((prev) => [...prev, duplicatedTemplate])
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("template-body") as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const currentBody = formData.body
      const newBody = currentBody.substring(0, start) + variable + currentBody.substring(end)
      setFormData((prev) => ({ ...prev, body: newBody }))

      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length, start + variable.length)
      }, 0)
    }
  }

  const insertVariableInSubject = (variable: string) => {
    const input = document.getElementById("template-subject") as HTMLInputElement
    if (input) {
      const start = input.selectionStart || 0
      const end = input.selectionEnd || 0
      const currentSubject = formData.subject
      const newSubject = currentSubject.substring(0, start) + variable + currentSubject.substring(end)
      setFormData((prev) => ({ ...prev, subject: newSubject }))

      // Set cursor position after the inserted variable
      setTimeout(() => {
        input.focus()
        input.setSelectionRange(start + variable.length, start + variable.length)
      }, 0)
    }
  }

  const replaceVariables = (text: string, data: any) => {
    let result = text
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g")
      result = result.replace(regex, value as string)
    })
    return result
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "interview":
        return "bg-blue-100 text-blue-800"
      case "acceptance":
        return "bg-green-100 text-green-800"
      case "rejection":
        return "bg-red-100 text-red-800"
      case "confirmation":
        return "bg-purple-100 text-purple-800"
      case "reminder":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen">


      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Admin Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-gray-600 mt-2">Manage email templates for recruitment communications</p>
          </div>
          <div className="flex-shrink-0">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingTemplate(null)
                    setFormData({ name: "", subject: "", body: "", category: "interview" })
                  }}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? "Edit Email Template" : "Create New Email Template"}</DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="editor" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="editor">Template Editor</TabsTrigger>
                  <TabsTrigger value="variables">Available Variables</TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Interview Invitation"
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value: string) => setFormData((prev) => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {templateCategories.slice(1).map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="template-subject">Subject Line</Label>
                      <div className="flex gap-1">
                        {templateVariables.map((variable) => (
                          <Button
                            key={variable.key}
                            color="white"
                            onClick={() => insertVariableInSubject(variable.key)}
                            className="text-xs"
                          >
                            {variable.key}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Input
                      id="template-subject"
                      value={formData.subject}
                      onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g., Interview Invitation - {{role}} at {{organisation_name}}"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="template-body">Email Body</Label>
                      <div className="flex gap-1 flex-wrap">
                        {templateVariables.map((variable) => (
                          <Button
                            key={variable.key}
                            color="white"
                            onClick={() => insertVariable(variable.key)}
                            className="text-xs"
                          >
                            {variable.key}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Textarea
                      id="template-body"
                      value={formData.body}
                      onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
                      placeholder="Enter your email template content here..."
                      className="min-h-[300px]"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleCreateTemplate}
                      disabled={!formData.name || !formData.subject || !formData.body}
                    >
                      {editingTemplate ? "Update Template" : "Create Template"}
                    </Button>
                    <Button color="white" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="variables" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Available Template Variables</h3>
                    <div className="space-y-3">
                      {templateVariables.map((variable) => (
                        <Card key={variable.key}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{variable.key}</code>
                                <p className="text-sm text-gray-600 mt-1">{variable.description}</p>
                                <p className="text-xs text-gray-500">Example: {variable.example}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  color="white"
                                  onClick={() => insertVariableInSubject(variable.key)}
                                >
                                  Add to Subject
                                </Button>
                                <Button color="white" onClick={() => insertVariable(variable.key)}>
                                  Add to Body
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{templates.length}</p>
                  <p className="text-sm text-gray-600">Total Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <UserIcon className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{templates.filter((t) => t.category === "interview").length}</p>
                  <p className="text-sm text-gray-600">Interview Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BuildingOfficeIcon className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{templates.filter((t) => t.category === "acceptance").length}</p>
                  <p className="text-sm text-gray-600">Acceptance Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{new Set(templates.map((t) => t.category)).size}</p>
                  <p className="text-sm text-gray-600">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search Templates</Label>
                <Input
                  id="search"
                  placeholder="Search by name or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Filter by Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  color="white"
                  onClick={() => {
                    setSelectedCategory("all")
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

        {/* Templates List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge className={`mt-2 ${getCategoryBadgeColor(template.category)}`}>
                      {templateCategories.find((c) => c.value === template.category)?.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Subject:</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{template.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Preview:</p>
                    <p className="text-sm text-gray-600 line-clamp-3">{template.body}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>Created: {new Date(template.createdAt).toLocaleDateString()}</p>
                    <p>Updated: {new Date(template.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button color="white" onClick={() => handlePreviewTemplate(template)}>
                    <EyeIcon className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button color="white" onClick={() => handleEditTemplate(template)}>
                    <PencilIcon className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button color="white" onClick={() => handleDuplicateTemplate(template)}>
                    <DocumentDuplicateIcon className="w-4 h-4 mr-1" />
                    Duplicate
                  </Button>
                  <Button
                    color="danger"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No templates found matching your filters.</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview - {previewTemplate?.name}</DialogTitle>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-6">
              {/* Email Header */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">To:</span>
                    <span className="text-sm">{previewData.name} &lt;sarah.chen@student.unsw.edu.au&gt;</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">From:</span>
                    <span className="text-sm">{previewData.organisation_name} &lt;recruitment@devsoc.com&gt;</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Subject:</span>
                    <span className="text-sm font-medium">
                      {replaceVariables(previewTemplate.subject, previewData)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="bg-white border rounded-lg p-6">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {replaceVariables(previewTemplate.body, previewData)}
                </div>
              </div>

              {/* Variables Used */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Variables Used in Preview:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(previewData).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <code className="bg-blue-100 px-2 py-1 rounded text-xs">{"{{" + key + "}}"}</code>
                      <span className="text-blue-800">→ {value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setShowPreviewDialog(false)}>Close Preview</Button>
                <Button color="white" onClick={() => handleEditTemplate(previewTemplate)}>
                  Edit Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
