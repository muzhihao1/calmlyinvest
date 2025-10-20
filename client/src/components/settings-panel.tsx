import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Download, Upload, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { RiskSettings } from "@shared/schema-supabase";

interface SettingsPanelProps {
  userId: string;
  currentSettings?: RiskSettings;
}

export function SettingsPanel({ userId, currentSettings }: SettingsPanelProps) {
  const [settings, setSettings] = useState({
    leverageSafeThreshold: currentSettings?.leverageSafeThreshold || "1.0",
    leverageWarningThreshold: currentSettings?.leverageWarningThreshold || "1.5",
    concentrationLimit: currentSettings?.concentrationLimit || "20.0",
    industryConcentrationLimit: currentSettings?.industryConcentrationLimit || "60.0",
    minCashRatio: currentSettings?.minCashRatio || "30.0",
    leverageAlerts: currentSettings?.leverageAlerts ?? true,
    expirationAlerts: currentSettings?.expirationAlerts ?? true,
    volatilityAlerts: currentSettings?.volatilityAlerts ?? false,
    dataUpdateFrequency: currentSettings?.dataUpdateFrequency || 5,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      const response = await apiRequest("PUT", `/api/user/${userId}/risk-settings`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}/risk-settings`] });
      toast({
        title: "设置已保存",
        description: "风险偏好设置已成功更新",
      });
    },
    onError: () => {
      toast({
        title: "保存失败",
        description: "无法保存设置，请稍后重试",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const handleReset = () => {
    setSettings({
      leverageSafeThreshold: "1.0",
      leverageWarningThreshold: "1.5",
      concentrationLimit: "20.0",
      industryConcentrationLimit: "60.0",
      minCashRatio: "30.0",
      leverageAlerts: true,
      expirationAlerts: true,
      volatilityAlerts: false,
      dataUpdateFrequency: 5,
    });
    toast({
      title: "设置已重置",
      description: "所有设置已恢复为默认值",
    });
  };

  return (
    <div className="space-y-6">
      {/* Risk Preferences */}
      <Card className="bg-slate-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">风险偏好设置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-4">杠杆率阈值</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-400">安全区间上限 (绿色)</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">&lt;</span>
                    <Input
                      type="number"
                      step="0.1"
                      value={settings.leverageSafeThreshold}
                      onChange={(e) => setSettings({...settings, leverageSafeThreshold: e.target.value})}
                      className="w-20 bg-slate-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-400">警告区间上限 (黄色)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={settings.leverageWarningThreshold}
                      onChange={(e) => setSettings({...settings, leverageWarningThreshold: e.target.value})}
                      className="w-20 bg-slate-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-4">集中度风险设置</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-400">单个标的上限</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="1"
                      value={settings.concentrationLimit}
                      onChange={(e) => setSettings({...settings, concentrationLimit: e.target.value})}
                      className="w-20 bg-slate-700 border-gray-600 text-white"
                    />
                    <span className="text-sm text-gray-400">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-400">行业集中度上限</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="1"
                      value={settings.industryConcentrationLimit}
                      onChange={(e) => setSettings({...settings, industryConcentrationLimit: e.target.value})}
                      className="w-20 bg-slate-700 border-gray-600 text-white"
                    />
                    <span className="text-sm text-gray-400">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-400">最低现金比例</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="1"
                      value={settings.minCashRatio}
                      onChange={(e) => setSettings({...settings, minCashRatio: e.target.value})}
                      className="w-20 bg-slate-700 border-gray-600 text-white"
                    />
                    <span className="text-sm text-gray-400">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-slate-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">通知设置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">杠杆率超标提醒</Label>
                <p className="text-sm text-gray-400">当杠杆率超过设定阈值时发送通知</p>
              </div>
              <Switch
                checked={settings.leverageAlerts}
                onCheckedChange={(checked) => setSettings({...settings, leverageAlerts: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">期权到期提醒</Label>
                <p className="text-sm text-gray-400">期权距离到期7天时发送提醒</p>
              </div>
              <Switch
                checked={settings.expirationAlerts}
                onCheckedChange={(checked) => setSettings({...settings, expirationAlerts: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">市场异常波动预警</Label>
                <p className="text-sm text-gray-400">VIX指数异常时发送预警通知</p>
              </div>
              <Switch
                checked={settings.volatilityAlerts}
                onCheckedChange={(checked) => setSettings({...settings, volatilityAlerts: checked})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="bg-slate-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">数据管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="text-white">数据更新频率</Label>
              <Select 
                value={settings.dataUpdateFrequency.toString()} 
                onValueChange={(value) => setSettings({...settings, dataUpdateFrequency: parseInt(value)})}
              >
                <SelectTrigger className="bg-slate-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">每5分钟自动更新</SelectItem>
                  <SelectItem value="10">每10分钟自动更新</SelectItem>
                  <SelectItem value="30">每30分钟自动更新</SelectItem>
                  <SelectItem value="0">仅手动更新</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-700">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="bg-primary hover:bg-blue-600"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? "保存中..." : "保存设置"}
              </Button>
              <Button variant="secondary">
                <Download className="mr-2 h-4 w-4" />
                导出配置
              </Button>
              <Button variant="secondary">
                <Upload className="mr-2 h-4 w-4" />
                导入配置
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReset}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                重置为默认
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
