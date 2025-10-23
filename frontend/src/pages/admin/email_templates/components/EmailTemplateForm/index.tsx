import { useRef, useState } from "react";
import Button from "@/components/Button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon } from "@heroicons/react/24/outline";
import { templateCategories, templateVariables } from "../../constants";
import VariableButtons from "../VariableButtons/index";
import type { EmailTemplate, FormData } from "../../types";


interface EmailTemplateFormProps {
 isOpen: boolean;
 onOpenChange: (open: boolean) => void;
 editingTemplate: EmailTemplate | null;
 formData: FormData;
 setFormData: React.Dispatch<React.SetStateAction<FormData>>;
 onSubmit: () => void;
 onStartCreate: () => void;
}


const EmailTemplateForm = ({
 isOpen,
 onOpenChange,
 editingTemplate,
 formData,
 setFormData,
 onSubmit,
 onStartCreate,
}: EmailTemplateFormProps) => {
 const subjectInputRef = useRef<HTMLInputElement>(null);
 const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
 const [lastFocused, setLastFocused] = useState<"subject" | "body">("subject");


 const insertAtCursor = (
   target: "subject" | "body",
   variable: string,
 ) => {
   if (target === "subject") {
     const input = subjectInputRef.current;
     if (!input) return;
     const start = input.selectionStart ?? input.value.length;
     const end = input.selectionEnd ?? input.value.length;
     const current = formData.subject;
     const next = current.slice(0, start) + variable + current.slice(end);
     setFormData((prev) => ({ ...prev, subject: next }));
     // restore cursor after state update
     requestAnimationFrame(() => {
       input.focus();
       const pos = start + variable.length;
       input.setSelectionRange(pos, pos);
     });
   } else {
     const textarea = bodyTextareaRef.current;
     if (!textarea) return;
     const start = textarea.selectionStart ?? textarea.value.length;
     const end = textarea.selectionEnd ?? textarea.value.length;
     const current = formData.body;
     const next = current.slice(0, start) + variable + current.slice(end);
     setFormData((prev) => ({ ...prev, body: next }));
     // Store scroll position before state update
     const scrollTop = textarea.scrollTop;
     requestAnimationFrame(() => {
       textarea.focus();
       const pos = start + variable.length;
       textarea.setSelectionRange(pos, pos);
       // Restore scroll position
       textarea.scrollTop = scrollTop;
     });
   }
 };


 const handleVariableInsert = (variable: string) => {
   insertAtCursor(lastFocused, variable);
 };


 return (
   <Dialog open={isOpen} onOpenChange={onOpenChange}>
     <DialogTrigger asChild>
       <Button
         onClick={onStartCreate}
         className="bg-black hover:bg-gray-800 text-white"
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
             </div>
             <Input
               id="template-subject"
               ref={subjectInputRef}
               onFocus={() => setLastFocused("subject")}
               value={formData.subject}
               onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
               placeholder="e.g., Interview Invitation - {{role}} at {{organisation_name}}"
             />
           </div>


           <div>
             <div className="flex items-center justify-between mb-2">
               <Label htmlFor="template-body">Email Body</Label>
             </div>
             <Textarea
               id="template-body"
               ref={bodyTextareaRef}
               onFocus={() => setLastFocused("body")}
               value={formData.body}
               onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
               placeholder="Enter your email template content here..."
               className="min-h-[300px]"
             />
             <VariableButtons onInsertVariable={handleVariableInsert} />
           </div>


           <div className="flex gap-3">
             <Button
               onClick={onSubmit}
               disabled={!formData.name || !formData.subject || !formData.body}
             >
               {editingTemplate ? "Update Template" : "Create Template"}
             </Button>
             <Button color="white" onClick={() => onOpenChange(false)}>
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
                       <div>
                         {/* Variable information only - insertion handled in editor tab */}
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
 );
};


export default EmailTemplateForm;
