import { Button } from "@/components/ui/button"
import { Ellipsis } from "lucide-react"

const EditMemberButton = () => {
    return (
        //somehow invert it, I want it to be shadow on hover and not as default drk how to do that yet
         <Button variant="ghost" size="icon" ><Ellipsis/></Button>
    );
}

export default EditMemberButton;