import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUp, Download, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const csvImportSchema = z.object({
  type: z.enum(["stock", "option"]),
  csvData: z.string().min(1, "CSV data is required")
});

type CsvImportForm = z.infer<typeof csvImportSchema>;

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string;
}

const stockCsvTemplate = `symbol,name,quantity,costPrice,currentPrice,beta
TSLA,Tesla Inc,100,180.50,188.42,2.04
AAPL,Apple Inc,50,165.75,170.25,1.19`;

const optionCsvTemplate = `optionSymbol,underlyingSymbol,optionType,direction,contracts,strikePrice,expirationDate,costPrice,currentPrice,deltaValue
MSFT 250718P500,MSFT,PUT,SELL,-1,500.00,2025-07-18,15.50,18.25,-0.507
NVDA 250815P155,NVDA,PUT,SELL,-1,155.00,2025-08-15,8.75,12.20,-0.378`;

export function CsvImportDialog({ open, onOpenChange, portfolioId }: CsvImportDialogProps) {
  const [parseError, setParseError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<CsvImportForm>({
    resolver: zodResolver(csvImportSchema),
    defaultValues: {
      type: "stock",
      csvData: ""
    }
  });

  const importType = form.watch("type");

  const importMutation = useMutation({
    mutationFn: async (data: CsvImportForm) => {
      const endpoint = data.type === "stock" 
        ? `/api/portfolio/${portfolioId}/stocks/import`
        : `/api/portfolio/${portfolioId}/options/import`;
      
      const response = await apiRequest("POST", endpoint, { csvData: data.csvData });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Import successful",
        description: `Imported ${data.count} ${importType} holdings`
      });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${portfolioId}/${importType}s`] });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${portfolioId}/risk`] });
      onOpenChange(false);
      form.reset();
      setParseError(null);
    },
    onError: (error: any) => {
      const message = error.message || "Failed to import CSV data";
      setParseError(message);
      toast({
        title: "Import failed",
        description: message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: CsvImportForm) => {
    setParseError(null);
    importMutation.mutate(data);
  };

  const downloadTemplate = () => {
    const template = importType === "stock" ? stockCsvTemplate : optionCsvTemplate;
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${importType}_holdings_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Holdings from CSV</DialogTitle>
          <DialogDescription>
            Upload your holdings data in CSV format. You can download a template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Import Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select import type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="stock">Stock Holdings</SelectItem>
                      <SelectItem value="option">Option Holdings</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="mb-2"
              >
                <Download className="mr-2 h-4 w-4" />
                Download {importType} template
              </Button>
            </div>

            <FormField
              control={form.control}
              name="csvData"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CSV Data</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste your CSV data here..."
                      className="min-h-[200px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {parseError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={importMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={importMutation.isPending}>
                {importMutation.isPending ? (
                  <>Importing...</>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" />
                    Import
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}