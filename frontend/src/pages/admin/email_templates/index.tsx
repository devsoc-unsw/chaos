import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeftIcon } from "@heroicons/react/24/outline"
import { mockTemplates } from "./constants"
import EmailTemplateFilters from "./components/EmailTemplateFilters/index"
import EmailTemplateCard from "./components/EmailTemplateCard/index"
import EmailTemplateForm from "./components/EmailTemplateForm/index"
import EmailTemplatePreview from "./components/EmailTemplateReview/index"
import type { EmailTemplate, FormData } from "./types"


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


 // Sort newest -> oldest by updatedAt (fallback to createdAt)
 const sortedTemplates = [...filteredTemplates].sort((a, b) => {
   const aTime = new Date(a.updatedAt || a.createdAt).getTime()
   const bTime = new Date(b.updatedAt || b.createdAt).getTime()
   return bTime - aTime
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
     // Insert newest at the front
     setTemplates((prev) => [newTemplate, ...prev])
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
      setTemplates((prev) => prev.filter((template) => template.id !== templateId))
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
   // Insert duplicate at the front
   setTemplates((prev) => [duplicatedTemplate, ...prev])
 }


 const handleStartCreate = () => {
   setEditingTemplate(null)
   setFormData({ name: "", subject: "", body: "", category: "interview" })
 }


  return (
   <div className="min-h-screen w-full flex justify-center mx-auto">
     <main className="container mx-auto px-4 py-8 flex justify-center">
       <div className="w-full max-w-6xl">
         <div className="mb-8">
            <Link
             to="/admin"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
             <ArrowLeftIcon className="w-4 h-4" />
              Back to Admin Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-gray-600 mt-2">Manage email templates for recruitment communications</p>
          </div>


         {/* Create Template Button */}
         <div className="mb-8">
           <EmailTemplateForm
             isOpen={showCreateDialog}
             onOpenChange={setShowCreateDialog}
             editingTemplate={editingTemplate}
             formData={formData}
             setFormData={setFormData}
             onSubmit={handleCreateTemplate}
             onStartCreate={handleStartCreate}
                    />
                  </div>




        {/* Filters */}
          <EmailTemplateFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />


        {/* Templates List */}
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {sortedTemplates.map((template) => (
             <EmailTemplateCard
               key={template.id}
               template={template}
               onPreview={handlePreviewTemplate}
               onEdit={handleEditTemplate}
               onDuplicate={handleDuplicateTemplate}
               onDelete={handleDeleteTemplate}
             />
          ))}
        </div>


         {sortedTemplates.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No templates found matching your filters.</p>
            </CardContent>
          </Card>
        )}
       </div>
      </main>


      {/* Preview Dialog */}
     <EmailTemplatePreview
       isOpen={showPreviewDialog}
       onClose={() => setShowPreviewDialog(false)}
       template={previewTemplate}
       onEdit={handleEditTemplate}
     />
    </div>
  )
}
