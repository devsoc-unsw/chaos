import { Card, CardContent } from "@/components/ui/card";
import { EnvelopeIcon, CalendarIcon, UserIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";
import type { EmailTemplate } from "../../types";


interface EmailTemplateStatsProps {
 templates: EmailTemplate[];
}


const EmailTemplateStats = ({ templates }: EmailTemplateStatsProps) => {
 return (
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
 );
};


export default EmailTemplateStats;


