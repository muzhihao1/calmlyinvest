import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { OptionHolding } from "@shared/schema-types";

const editOptionFormSchema = z.object({
  underlyingSymbol: z.string().min(1, "标的股票不能为空").toUpperCase(),
  optionType: z.enum(["CALL", "PUT"]),
  direction: z.enum(["BUY", "SELL"]),
  contracts: z.coerce.number().transform(val => {
    const num = Number(val);
    return isNaN(num) ? 1 : num;
  }),
  strikePrice: z.string().regex(/^\d+(\.\d{1,4})?$/, "执行价格式不正确"),
  expirationDate: z.date({
    required_error: "请选择到期日",
  }),
  costPrice: z.string().regex(/^\d+(\.\d{1,4})?$/, "期权价格格式不正确"),
  currentPrice: z.string().regex(/^\d+(\.\d{1,4})?$/, "当前价格式不正确").optional(),
  deltaValue: z.string().regex(/^-?\d+(\.\d{1,4})?$/, "Delta值格式不正确").optional(),
});

interface EditOptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  option: OptionHolding | null;
  portfolioId: string;
}

export function EditOptionDialog({ open, onOpenChange, option, portfolioId }: EditOptionDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof editOptionFormSchema>>({
    resolver: zodResolver(editOptionFormSchema),
    defaultValues: {
      underlyingSymbol: "",
      optionType: "PUT",
      direction: "SELL",
      contracts: 1,
      strikePrice: "",
      costPrice: "",
      currentPrice: "",
      deltaValue: "0",
    },
  });

  useEffect(() => {
    if (option) {
      form.reset({
        underlyingSymbol: option.underlyingSymbol,
        optionType: option.optionType as "CALL" | "PUT",
        direction: option.direction as "BUY" | "SELL",
        contracts: option.contracts,
        // Convert number types to strings for form validation
        strikePrice: String(option.strikePrice),
        expirationDate: new Date(option.expirationDate),
        costPrice: String(option.costPrice),
        currentPrice: option.currentPrice ? String(option.currentPrice) : "",
        deltaValue: option.deltaValue ? String(option.deltaValue) : "0",
      });
    }
  }, [option, form]);

  const editMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editOptionFormSchema>) => {
      if (!option) return;
      
      // Generate option symbol
      const dateStr = format(data.expirationDate, "yyMMdd");
      const typeChar = data.optionType === "CALL" ? "C" : "P";
      const strikeInt = Math.round(parseFloat(data.strikePrice));
      const optionSymbol = `${data.underlyingSymbol} ${dateStr}${typeChar}${strikeInt}`;
      
      const finalData = {
        ...data,
        optionSymbol,
        expirationDate: format(data.expirationDate, "yyyy-MM-dd"),
        // Keep contracts as positive number, direction field indicates BUY/SELL
        contracts: Math.abs(data.contracts),
        portfolioId,
        currentPrice: data.currentPrice || data.costPrice
      };
      
      const response = await apiRequest("PUT", `/api/options/${option.id}`, finalData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all portfolio-related queries to ensure UI updates immediately
      // Must include portfolioId parameter to match the actual query keys
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-options-simple?portfolioId=${portfolioId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-details-simple?portfolioId=${portfolioId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-risk-simple?portfolioId=${portfolioId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-stocks-simple?portfolioId=${portfolioId}`] });
      toast({
        title: "更新成功",
        description: "期权持仓已更新",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "更新失败",
        description: error.message || "无法更新期权持仓，请检查输入信息",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof editOptionFormSchema>) => {
    editMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">编辑期权持仓</DialogTitle>
          <DialogDescription className="text-gray-400">
            修改期权持仓信息
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="underlyingSymbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">标的股票</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="如: TSLA"
                      className="bg-slate-700 border-gray-600 text-white"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="optionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">期权类型</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-700 border-gray-600 text-white">
                          <SelectValue placeholder="选择类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CALL">看涨期权</SelectItem>
                        <SelectItem value="PUT">看跌期权</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">买卖方向</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-700 border-gray-600 text-white">
                          <SelectValue placeholder="选择方向" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BUY">买入</SelectItem>
                        <SelectItem value="SELL">卖出</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-gray-300">到期日</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "bg-slate-700 border-gray-600 text-white hover:bg-slate-600",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "yyyy-MM-dd")
                          ) : (
                            <span>选择到期日</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="strikePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">执行价 ($)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="300.00"
                        className="bg-slate-700 border-gray-600 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contracts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">合约数量</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1"
                        className="bg-slate-700 border-gray-600 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">期权价格 ($)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="6.60"
                        className="bg-slate-700 border-gray-600 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400 text-xs">
                      输入期权的交易价格（每股）
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deltaValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Delta值</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0.50"
                        className="bg-slate-700 border-gray-600 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400 text-xs">
                      期权的Delta值（-1到1之间）
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={editMutation.isPending}
                className="bg-primary hover:bg-blue-600"
              >
                {editMutation.isPending ? "更新中..." : "更新期权"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}