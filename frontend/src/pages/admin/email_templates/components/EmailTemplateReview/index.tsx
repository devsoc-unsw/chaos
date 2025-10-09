import Button from "@/components/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { previewData } from "../../types";
import type { EmailTemplate } from "../../types";


interface EmailTemplatePreviewProps {
 isOpen: boolean;
 onClose: () => void;
 template: EmailTemplate | null;
 onEdit: (template: EmailTemplate) => void;
}


const EmailTemplatePreview = ({ isOpen, onClose, template, onEdit }: EmailTemplatePreviewProps) => {
 const replaceVariables = (text: string, data: any) => {
   let result = text;
   Object.entries(data).forEach(([key, value]) => {
     const regex = new RegExp(`{{${key}}}`, "g");
     result = result.replace(regex, value as string);
   });
   return result;
 };


 if (!template) return null;


 return (
   <Dialog open={isOpen} onOpenChange={onClose}>
     <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
       <DialogHeader>
         <DialogTitle>Email Preview - {template.name}</DialogTitle>
       </DialogHeader>


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
                 {replaceVariables(template.subject, previewData)}
               </span>
             </div>
           </div>
         </div>


         {/* Email Body */}
         <div className="bg-white border rounded-lg p-6">
           <div className="whitespace-pre-wrap text-sm leading-relaxed">
             {replaceVariables(template.body, previewData)}
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
           <Button onClick={onClose}>Close Preview</Button>
           <Button color="white" onClick={() => onEdit(template)}>
             Edit Template
           </Button>
         </div>
       </div>
     </DialogContent>
   </Dialog>
 );
};


export default EmailTemplatePreview;
