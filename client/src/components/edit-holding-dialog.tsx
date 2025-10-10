import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StockHolding } from "@shared/schema-types";

const editStockFormSchema = z.object({
  symbol: z.string().min(1, "股票代码不能为空").toUpperCase(),
  name: z.string().optional(),
  quantity: z.coerce.number().min(1, "持仓数量必须大于0"),
  costPrice: z.string().regex(/^\d+(\.\d{1,4})?$/, "成本价格式不正确"),
  currentPrice: z.string().regex(/^\d+(\.\d{1,4})?$/, "当前价格式不正确"),
  beta: z.string().regex(/^\d+(\.\d{1,4})?$/, "Beta值格式不正确").optional(),
});

interface EditHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding: StockHolding | null;
  portfolioId: string;
}

export function EditHoldingDialog({ open, onOpenChange, holding, portfolioId }: EditHoldingDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof editStockFormSchema>>({
    resolver: zodResolver(editStockFormSchema),
    defaultValues: {
      symbol: "",
      name: "",
      quantity: 1,
      costPrice: "0",
      currentPrice: "0",
      beta: "1.0",
    },
  });

  useEffect(() => {
    if (holding) {
      form.reset({
        symbol: holding.symbol,
        name: holding.name || "",
        quantity: holding.quantity,
        costPrice: String(holding.costPrice || "0"),
        currentPrice: String(holding.currentPrice || "0"),
        beta: String(holding.beta || "1.0"),
      });
    }
  }, [holding, form]);

  const editMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editStockFormSchema>) => {
      if (!holding) return;
      const response = await apiRequest("PUT", `/api/stocks/${holding.id}`, {
        ...data,
        portfolioId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${portfolioId}/stocks`] });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${portfolioId}/risk`] });
      toast({
        title: "更新成功",
        description: "股票持仓已更新",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "更新失败",
        description: error.message || "无法更新股票持仓，请检查输入信息",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof editStockFormSchema>) => {
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
          <DialogTitle className="text-white">编辑股票持仓</DialogTitle>
          <DialogDescription className="text-gray-400">
            修改股票持仓信息
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">股票代码</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="如: TSLA"
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">公司名称（可选）</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="如: Tesla Inc"
                      className="bg-slate-700 border-gray-600 text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
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
                control={form.control}
                name="beta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Beta值</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1.0"
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

              <FormField
                control={form.control}
                name="currentPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">当前价 ($)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="312.70"
                        className="bg-slate-700 border-gray-600 text-white"
                        {...field}
                      />
                    </FormControl>
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
                {editMutation.isPending ? "更新中..." : "更新股票"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}