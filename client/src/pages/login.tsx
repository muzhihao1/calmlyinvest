import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6个字符"),
});

const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6个字符"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      toast({
        title: "登录成功",
        description: "欢迎回来！",
      });
    } catch (error: any) {
      toast({
        title: "登录失败",
        description: error.message || "邮箱或密码错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password);
      toast({
        title: "注册成功",
        description: "请查看邮箱确认注册（如未收到，可直接尝试登录）",
      });
      // Switch to login tab
      const loginTab = document.querySelector('[value="login"]') as HTMLElement;
      if (loginTab) loginTab.click();
      
      // Auto-fill login form
      loginForm.setValue("email", data.email);
      loginForm.setValue("password", data.password);
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Provide helpful guidance for common errors
      let errorMessage = error.message || "注册过程中出现错误";
      let description = "";
      
      if (error.message?.includes("过于频繁")) {
        description = "建议使用访客模式体验，或稍后再试";
      } else if (error.message?.includes("已经注册")) {
        description = "请切换到登录标签页";
        // Auto switch to login tab
        const loginTab = document.querySelector('[value="login"]') as HTMLElement;
        if (loginTab) loginTab.click();
        loginForm.setValue("email", data.email);
      }
      
      toast({
        title: "注册失败",
        description: errorMessage + (description ? `\n${description}` : ""),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    // Demo login removed - users should use guest mode or create their own account
    toast({
      title: "提示",
      description: "请使用访客模式体验，或注册您自己的账号",
    });
    handleGuestMode();
  };

  const handleGuestMode = () => {
    // Navigate directly to dashboard in guest mode
    setLocation("/?guest=true");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-white">持仓助手</h1>
          </div>
          <CardDescription className="text-gray-400">
            智能股票期权风险管理系统
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">邮箱</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="请输入邮箱"
                            className="bg-slate-700 border-gray-600 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">密码</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="请输入密码"
                            className="bg-slate-700 border-gray-600 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-blue-600"
                    disabled={isLoading}
                  >
                    {isLoading ? "登录中..." : "登录"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">邮箱</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="请输入邮箱"
                            className="bg-slate-700 border-gray-600 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">密码</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="请输入密码"
                            className="bg-slate-700 border-gray-600 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">确认密码</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="请再次输入密码"
                            className="bg-slate-700 border-gray-600 text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-blue-600"
                    disabled={isLoading}
                  >
                    {isLoading ? "注册中..." : "注册"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleGuestMode}
          >
            访客模式（无需登录）
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-sm text-gray-400"
            onClick={handleDemoLogin}
          >
            快速体验
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}