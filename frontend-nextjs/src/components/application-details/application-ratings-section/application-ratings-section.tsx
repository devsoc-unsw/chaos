"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getCategoryRatingsByApplication,
  getRatingCategories,
  type RatingDetails,
} from "@/models/rating";

function averageCategoryScore(rating: RatingDetails): string {
  const nums = rating.category_ratings
    .map((cr) => cr.rating)
    .filter((n): n is number => n != null);
  if (nums.length === 0) {
    return "—";
  }
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
}

function scoreForCategory(
  rating: RatingDetails,
  categoryId: string,
): string {
  const cr = rating.category_ratings.find(
    (c) => c.campaign_rating_category_id === categoryId,
  );
  if (cr?.rating == null) {
    return "—";
  }
  return String(cr.rating);
}

type Props = {
  applicationId: string;
  campaignId: string;
  dict: any;
};

export default function ApplicationRatingsSection({
  applicationId,
  campaignId,
  dict,
}: Props) {
  const { data: ratingRows = [], isLoading: ratingsLoading } = useQuery({
    queryKey: ["application-ratings", applicationId],
    queryFn: () => getCategoryRatingsByApplication(applicationId),
  });

  const { data: ratingCategories } = useQuery({
    queryKey: [`${campaignId}-rating-categories`],
    queryFn: () => getRatingCategories(campaignId),
  });

  const d = dict.dashboard.campaigns.application_summary_page;
  const categories = ratingCategories ?? [];

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          {d.individual_ratings ?? "Individual ratings"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ratingsLoading && (!ratingRows || ratingRows.length === 0) ? (
          <p className="text-sm text-muted-foreground">{d.loading}</p>
        ) : !ratingRows || ratingRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{d.no_ratings}</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">
                    {dict.dashboard.campaigns.application_review_page
                      .application_rating ?? "Reviewer"}
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    {dict.dashboard.campaigns.application_review_page
                      .review_comment ?? "Comment"}
                  </TableHead>
                  {categories.map((cat) => (
                    <TableHead key={cat.id} className="text-center">
                      {cat.name}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">{d.avg_rating}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratingRows.map((rating) => (
                  <TableRow key={rating.id}>
                    <TableCell className="align-top font-medium">
                      {rating.rater_name}
                    </TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground">
                      {rating.comment?.trim()
                        ? rating.comment
                        : d.no_comment ?? "—"}
                    </TableCell>
                    {categories.map((cat) => (
                      <TableCell key={cat.id} className="text-center">
                        {scoreForCategory(rating, cat.id)}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-medium">
                      {averageCategoryScore(rating)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
