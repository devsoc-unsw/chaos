import Button from "@/components/Button";
import { templateVariables } from "../../constants";
import type { TemplateVariable } from "../../types";


interface VariableButtonsProps {
 onInsertVariable: (variable: string) => void;
}


const VariableButtons = ({ onInsertVariable }: VariableButtonsProps) => {
 return (
   <div className="mt-3 flex gap-1 flex-wrap">
     {templateVariables.map((variable) => (
       <Button
         key={variable.key}
         color="white"
         className="text-xs"
         onClick={() => onInsertVariable(variable.key)}
       >
         {variable.key}
       </Button>
     ))}
   </div>
 );
};


export default VariableButtons;


