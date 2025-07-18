import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertStockHoldingSchema, insertOptionHoldingSchema } from "@shared/schema-types";

const stockFormSchema = z.object({
  portfolioId: z.union([z.string(), z.number()]),
  symbol: z.string().min(1, "股票代码不能为空").toUpperCase(),
  name: z.string().optional(),
  quantity: z.coerce.number().min(1, "持仓数量必须大于0"),
  costPrice: z.string().regex(/^\d+(\.\d{1,4})?$/, "成本价格式不正确"),
  currentPrice: z.string().regex(/^\d+(\.\d{1,4})?$/, "当前价格式不正确").optional(),
  beta: z.string().regex(/^\d+(\.\d{1,4})?$/, "Beta值格式不正确").optional(),
});

const optionFormSchema = z.object({
  portfolioId: z.union([z.string(), z.number()]),
  optionSymbol: z.string().min(1, "期权代码不能为空"),
  underlyingSymbol: z.string().min(1, "标的股票不能为空").toUpperCase(),
  optionType: z.enum(["CALL", "PUT"], { required_error: "请选择期权类型" }),
  direction: z.enum(["BUY", "SELL"], { required_error: "请选择买卖方向" }),
  contracts: z.coerce.number().min(1, "合约数量必须大于0"),
  strikePrice: z.string().regex(/^\d+(\.\d{1,4})?$/, "执行价格式不正确"),
  expirationDate: z.date({ required_error: "请选择到期日" }),
  costPrice: z.string().regex(/^\d+(\.\d{1,4})?$/, "期权价格格式不正确"),
  currentPrice: z.string().optional(),
  deltaValue: z.string().regex(/^-?\d+(\.\d{1,4})?$/, "Delta值格式不正确").optional(),
});

interface AddHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "stock" | "option";
  portfolioId: string | number | null;
}

export function AddHoldingDialog({ open, onOpenChange, type, portfolioId }: AddHoldingDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  console.log("AddHoldingDialog rendered, open:", open, "type:", type, "portfolioId:", portfolioId);
  
  // Don't render if no portfolioId
  if (!portfolioId) {
    return null;
  }

  const stockForm = useForm<z.infer<typeof stockFormSchema>>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: {
      portfolioId,
      symbol: "",
      quantity: 1,
      costPrice: "",
      // 不设置可选字段的默认值，让它们保持 undefined
    },
  });

  const optionForm = useForm<z.infer<typeof optionFormSchema>>({
    resolver: zodResolver(optionFormSchema),
    defaultValues: {
      portfolioId,
      optionSymbol: "",
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

  // Generate option symbol based on user inputs
  const generateOptionSymbol = () => {
    const underlying = optionForm.getValues("underlyingSymbol");
    const type = optionForm.getValues("optionType");
    const expDate = optionForm.getValues("expirationDate");
    const strike = optionForm.getValues("strikePrice");

    if (underlying && type && expDate && strike) {
      // Format: SYMBOL YYMMDDCXXX (e.g., TSLA 250315C300)
      const dateStr = format(expDate, "yyMMdd");
      const typeChar = type === "CALL" ? "C" : "P";
      const strikeInt = Math.round(parseFloat(strike));
      const symbol = `${underlying} ${dateStr}${typeChar}${strikeInt}`;
      optionForm.setValue("optionSymbol", symbol);
    }
  };

  // Watch for changes to auto-generate option symbol
  useEffect(() => {
    if (type === "option") {
      const subscription = optionForm.watch((value, { name }) => {
        if (["underlyingSymbol", "optionType", "expirationDate", "strikePrice"].includes(name || "")) {
          generateOptionSymbol();
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [optionForm, type]);

  const addStockMutation = useMutation({
    mutationFn: async (data: z.infer<typeof stockFormSchema>) => {
      // 获取股票信息
      let finalData = { ...data };
      
      try {
        const quoteResponse = await apiRequest("GET", `/api/stock/quote/${data.symbol}`);
        const quote = await quoteResponse.json();
        
        // 自动填充数据
        finalData.currentPrice = quote.price.toFixed(2);
        finalData.beta = (quote.beta || 1.0).toFixed(2);
        finalData.name = quote.name || data.symbol;
      } catch (error) {
        // 如果获取失败，使用默认值
        finalData.currentPrice = data.costPrice;
        finalData.beta = "1.0";
        finalData.name = data.symbol;
      }
      
      const response = await apiRequest("POST", `/api/portfolio/${portfolioId}/stocks`, finalData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${portfolioId}/stocks`] });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${portfolioId}/risk`] });
      toast({
        title: "添加成功",
        description: "股票持仓已添加到投资组合",
      });
      stockForm.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "添加失败",
        description: error.message || "无法添加股票持仓，请检查输入信息",
        variant: "destructive",
      });
    },
  });

  const addOptionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof optionFormSchema>) => {
      // 设置当前价格与成本价相同
      const finalData = {
        ...data,
        currentPrice: data.costPrice
      };
      const response = await apiRequest("POST", `/api/portfolio/${portfolioId}/options`, finalData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${portfolioId}/options`] });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${portfolioId}/risk`] });
      toast({
        title: "添加成功",
        description: "期权持仓已添加到投资组合",
      });
      optionForm.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "添加失败",
        description: error.message || "无法添加期权持仓，请检查输入信息",
        variant: "destructive",
      });
    },
  });

  const onStockSubmit = (data: z.infer<typeof stockFormSchema>) => {
    console.log("股票表单提交，数据：", data);
    // 清理空的可选字段，避免验证失败
    const cleanedData = {
      ...data,
      name: data.name || undefined,
      currentPrice: data.currentPrice || undefined,
      beta: data.beta || undefined
    };
    console.log("清理后的数据：", cleanedData);
    addStockMutation.mutate(cleanedData);
  };

  const onOptionSubmit = (data: z.infer<typeof optionFormSchema>) => {
    addOptionMutation.mutate(data);
  };

  const handleClose = () => {
    stockForm.reset();
    optionForm.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {type === "stock" ? "添加股票持仓" : "添加期权持仓"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {type === "stock" 
              ? "请输入股票持仓的详细信息"
              : "请输入期权持仓的详细信息"
            }
          </DialogDescription>
        </DialogHeader>

        {type === "stock" ? (
          <Form {...stockForm}>
            <form onSubmit={stockForm.handleSubmit(onStockSubmit)} className="space-y-4">
              <FormField
                control={stockForm.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">股票代码</FormLabel>
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

              <FormField
                control={stockForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">持仓数量</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        className="bg-slate-700 border-gray-600 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stockForm.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">成本价 ($)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="285.50"
                        className="bg-slate-700 border-gray-600 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  取消
                </Button>
                <Button 
                  type="submit" 
                  disabled={addStockMutation.isPending}
                  className="bg-primary hover:bg-blue-600"
                >
                  {addStockMutation.isPending ? "添加中..." : "添加股票"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...optionForm}>
            <form onSubmit={optionForm.handleSubmit(onOptionSubmit)} className="space-y-4">
              <FormField
                control={optionForm.control}
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
                  control={optionForm.control}
                  name="optionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">期权类型</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  control={optionForm.control}
                  name="direction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">买卖方向</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                control={optionForm.control}
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
                  control={optionForm.control}
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
                  control={optionForm.control}
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
                  control={optionForm.control}
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
                  control={optionForm.control}
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
                  disabled={addOptionMutation.isPending}
                  className="bg-primary hover:bg-blue-600"
                >
                  {addOptionMutation.isPending ? "添加中..." : "添加期权"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
