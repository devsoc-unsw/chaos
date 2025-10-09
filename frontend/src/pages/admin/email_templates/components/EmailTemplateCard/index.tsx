import Button from "@/components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
 AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EyeIcon, PencilIcon, DocumentDuplicateIcon, TrashIcon } from "@heroicons/react/24/outline";
import { templateCategories } from "../../constants";
import type { EmailTemplate } from "../../types";


interface EmailTemplateCardProps {
 template: EmailTemplate;
 onPreview: (template: EmailTemplate) => void;
 onEdit: (template: EmailTemplate) => void;
 onDuplicate: (template: EmailTemplate) => void;
 onDelete: (templateId: number) => void;
}


const EmailTemplateCard = ({
 template,
 onPreview,
 onEdit,
 onDuplicate,
 onDelete,
}: EmailTemplateCardProps) => {
 const getCategoryBadgeColor = (category: string) => {
   switch (category) {
     case "interview":
       return "bg-blue-100 text-blue-800";
     case "acceptance":
       return "bg-green-100 text-green-800";
     case "rejection":
       return "bg-red-100 text-red-800";
     case "confirmation":
       return "bg-purple-100 text-purple-800";
     case "reminder":
       return "bg-orange-100 text-orange-800";
     default:
       return "bg-gray-100 text-gray-800";
   }
 };


 return (
   <Card key={template.id} className="hover:shadow-md transition-shadow flex flex-col h-full">
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
     <CardContent className="flex flex-col flex-1">
       <div className="space-y-3 flex-1">
         <div>
           <p className="text-sm font-medium text-gray-700">Subject:</p>
           <p className="text-sm text-gray-600 line-clamp-2">{template.subject}</p>
         </div>
         <div>
           <p className="text-sm font-medium text-gray-700">Preview:</p>
           <p className="text-sm text-gray-600 line-clamp-3">{template.body}</p>
         </div>
       </div>


       <div className="mt-auto">
         <div className="text-xs text-gray-500 mb-4">
           <p>Created: {new Date(template.createdAt).toLocaleDateString()}</p>
           <p>Updated: {new Date(template.updatedAt).toLocaleDateString()}</p>
         </div>


         <div className="flex justify-between items-center gap-2">
           <div className="flex gap-2">
             <Button color="white" onClick={() => onPreview(template)} className="w-24 text-xs">
               <EyeIcon className="w-4 h-4 mr-1 flex-shrink-0" />
               <span>Preview</span>
             </Button>
             <Button color="white" onClick={() => onEdit(template)} className="w-20 text-xs">
               <PencilIcon className="w-4 h-4 mr-1 flex-shrink-0" />
               <span>Edit</span>
             </Button>
             <Button color="white" onClick={() => onDuplicate(template)} className="w-20 text-xs">
               <DocumentDuplicateIcon className="w-4 h-4 mr-1 flex-shrink-0" />
               <span>Copy</span>
             </Button>
           </div>
           <AlertDialog>
             <AlertDialogTrigger asChild>
               <Button
                 color="danger"
                 className="flex-shrink-0 bg-red-600 text-white hover:bg-red-700"
                 aria-label="Delete template"
               >
                 <TrashIcon className="w-4 h-4" />
               </Button>
             </AlertDialogTrigger>
             <AlertDialogContent>
               <AlertDialogHeader>
                 <AlertDialogTitle>Delete template?</AlertDialogTitle>
                 <AlertDialogDescription>
                   This action cannot be undone. This will permanently delete the email template
                   "{template.name}".
                 </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                 <AlertDialogCancel>Cancel</AlertDialogCancel>
                 <AlertDialogAction onClick={() => onDelete(template.id)}>
                   Delete
                 </AlertDialogAction>
               </AlertDialogFooter>
             </AlertDialogContent>
           </AlertDialog>
         </div>
       </div>
     </CardContent>
   </Card>
 );
};


export default EmailTemplateCard;
