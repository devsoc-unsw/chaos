import Button from "@/components/Button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { templateCategories } from "../../constants";

interface EmailTemplateFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
}

const EmailTemplateFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
}: EmailTemplateFiltersProps) => {
  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSearchTerm("");
  };

  return (
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
                  <SelectItem
                    key={category.value}
                    value={category.value}
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  >
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              color="white"
              onClick={handleClearFilters}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTemplateFilters;
