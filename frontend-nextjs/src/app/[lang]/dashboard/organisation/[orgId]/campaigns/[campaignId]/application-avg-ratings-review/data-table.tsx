"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { dateToString } from "@/lib/utils";
import type { AggregatedApplicationRating } from "./columns";

type DataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  roles?: Array<{ id: string; name: string }>;
  dict: any;
};

function CommentText({ comment, ratingIndex }: { comment: string | null; ratingIndex: number }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const textRef = React.useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  React.useEffect(() => {
    if (textRef.current && comment && comment !== "-") {
      const computedStyle = window.getComputedStyle(textRef.current);
      const lineHeightStr = computedStyle.lineHeight;
      let lineHeight: number;
      
      if (lineHeightStr === 'normal') {
        // Fallback: use font-size * 1.2 as typical line-height
        const fontSize = parseFloat(computedStyle.fontSize);
        lineHeight = fontSize * 1.2;
      } else {
        lineHeight = parseFloat(lineHeightStr);
      }
      
      // Check if content is more than one line (with some tolerance)
      const isOverflow = textRef.current.scrollHeight > lineHeight * 1.5;
      setIsOverflowing(isOverflow);
    } else {
      setIsOverflowing(false);
    }
  }, [comment, isExpanded]);

  if (!comment || comment === "-") {
    return <p className="text-sm text-muted-foreground mt-1">-</p>;
  }

  return (
    <div className="mt-1">
      <p 
        ref={textRef}
        className={`text-sm text-muted-foreground break-words w-full min-w-0 max-w-full ${!isExpanded ? 'line-clamp-1' : ''}`}
        style={{ 
          wordWrap: 'break-word', 
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap', // Preserves spaces and line breaks like textarea
          overflow: isExpanded ? 'visible' : 'hidden'
        }}
      >
        {comment}
      </p>
      {isOverflowing && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary hover:underline mt-1"
        >
          {isExpanded ? "...less" : "...more"}
        </button>
      )}
    </div>
  );
}

export function DataTable<TData extends AggregatedApplicationRating>({ columns, data, roles, dict }: DataTableProps<TData>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({});
  const [hoveredRatingIndex, setHoveredRatingIndex] = React.useState<number | null>(null);

  const toggleExpanded = React.useCallback((applicationId: string, open: boolean) => {
    setExpandedRows(prev => ({
      ...prev,
      [applicationId]: open,
    }));
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: {
      columnFilters,
    },
    meta: {
      expandedRows,
      toggleExpanded,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 justify-between">
        <Input
          placeholder={dict.dashboard.campaigns.application_avg_ratings_table.filter_emails}
          value={(table.getColumn("user_email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("user_email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        {roles && roles.length > 0 && (
          <div className="ml-auto">
            <Select
              value={(table.getColumn("campaign_role_id")?.getFilterValue() as string) || "all"}
              onValueChange={(value) =>
                table.getColumn("campaign_role_id")?.setFilterValue(
                  value === "all" ? undefined : value,
                )
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={dict.dashboard.campaigns.application_avg_ratings_table.filter_by_role} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dict.dashboard.campaigns.application_avg_ratings_table.all_roles}</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="rounded-md border overflow-hidden">
        <div className="w-full overflow-x-auto">
          <Table className="w-full" style={{ tableLayout: 'fixed' }}>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="font-semibold">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => {
                const application = row.original as AggregatedApplicationRating;
                const isExpanded = expandedRows[application.application_id] || false;
                
                return (
                  <React.Fragment key={row.id}>
                    <TableRow>
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {isExpanded && application.individual_ratings.length > 0 && (
                      <>
                        {application.individual_ratings.map((rating, index) => (
                          <React.Fragment key={index}>
                            <TableRow 
                              className={rating.comment ? `border-b-0 ${hoveredRatingIndex === index ? 'bg-muted/50' : ''}` : ""}
                              onMouseEnter={() => setHoveredRatingIndex(index)}
                              onMouseLeave={() => setHoveredRatingIndex(null)}
                            >
                              <TableCell className="align-top">
                                <span className="font-medium text-green-600 dark:text-green-400">{rating.rater_name}</span>
                              </TableCell>
                              <TableCell className="align-top">
                                <span></span>
                              </TableCell>
                              <TableCell className="align-top">
                                <span></span>
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="flex items-center gap-2 justify-left">
                                  <span className="text-green-600 dark:text-green-400">{rating.rating.toFixed(2)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <span>{dateToString(rating.updated_at)}</span>
                              </TableCell>
                            </TableRow>
                            {rating.comment && (
                              <TableRow 
                                className={`border-t-0 [&>td]:border-t-0 [&>td]:pt-0 ${hoveredRatingIndex === index ? 'bg-muted/50' : ''}`}
                                onMouseEnter={() => setHoveredRatingIndex(index)}
                                onMouseLeave={() => setHoveredRatingIndex(null)}
                              >
                                <TableCell colSpan={columns.length} className="pb-2 px-2 pt-0 border-t-0 border-b">
                                  <CommentText comment={rating.comment} ratingIndex={index} />
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {dict.dashboard.campaigns.application_avg_ratings_table.no_results}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}