/**
 * Step 5: Sector Preferences Selection
 * User selects preferred and avoided sectors
 */

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { UpdatePreferencesPayload } from "@/hooks/use-user-preferences";

interface Step5Props {
  currentValue?: {
    prefer: string[];
    avoid: string[];
  };
  onComplete: (data: Partial<UpdatePreferencesPayload>) => void;
  isPending: boolean;
}

interface Sector {
  id: string;
  name: string;
  nameZh: string;
  icon: string;
  description: string;
}

const SECTORS: Sector[] = [
  {
    id: 'technology',
    name: 'Technology',
    nameZh: '科技',
    icon: '💻',
    description: 'Software, hardware, IT services',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    nameZh: '医疗',
    icon: '🏥',
    description: 'Pharmaceuticals, biotech, medical devices',
  },
  {
    id: 'financials',
    name: 'Financials',
    nameZh: '金融',
    icon: '🏦',
    description: 'Banks, insurance, asset management',
  },
  {
    id: 'consumer_discretionary',
    name: 'Consumer Discretionary',
    nameZh: '非必需消费',
    icon: '🛍️',
    description: 'Retail, automotive, entertainment',
  },
  {
    id: 'consumer_staples',
    name: 'Consumer Staples',
    nameZh: '必需消费',
    icon: '🛒',
    description: 'Food, beverages, household products',
  },
  {
    id: 'energy',
    name: 'Energy',
    nameZh: '能源',
    icon: '⚡',
    description: 'Oil, gas, renewable energy',
  },
  {
    id: 'industrials',
    name: 'Industrials',
    nameZh: '工业',
    icon: '🏭',
    description: 'Manufacturing, construction, aerospace',
  },
  {
    id: 'materials',
    name: 'Materials',
    nameZh: '原材料',
    icon: '⛏️',
    description: 'Chemicals, metals, mining',
  },
  {
    id: 'real_estate',
    name: 'Real Estate',
    nameZh: '房地产',
    icon: '🏢',
    description: 'REITs, property development',
  },
  {
    id: 'utilities',
    name: 'Utilities',
    nameZh: '公用事业',
    icon: '💡',
    description: 'Electric, water, gas services',
  },
  {
    id: 'telecommunications',
    name: 'Telecommunications',
    nameZh: '电信',
    icon: '📡',
    description: 'Telecom services, infrastructure',
  },
  {
    id: 'transportation',
    name: 'Transportation',
    nameZh: '交通运输',
    icon: '🚚',
    description: 'Airlines, logistics, shipping',
  },
];

export function Step5SectorPreferences({ currentValue, onComplete, isPending }: Step5Props) {
  const [preferredSectors, setPreferredSectors] = useState<string[]>(
    currentValue?.prefer || []
  );
  const [avoidedSectors, setAvoidedSectors] = useState<string[]>(
    currentValue?.avoid || []
  );

  const handleTogglePrefer = (sectorId: string) => {
    // Remove from avoided if exists
    setAvoidedSectors(prev => prev.filter(id => id !== sectorId));

    // Toggle in preferred
    setPreferredSectors(prev =>
      prev.includes(sectorId)
        ? prev.filter(id => id !== sectorId)
        : [...prev, sectorId]
    );
  };

  const handleToggleAvoid = (sectorId: string) => {
    // Remove from preferred if exists
    setPreferredSectors(prev => prev.filter(id => id !== sectorId));

    // Toggle in avoided
    setAvoidedSectors(prev =>
      prev.includes(sectorId)
        ? prev.filter(id => id !== sectorId)
        : [...prev, sectorId]
    );
  };

  const handleSubmit = () => {
    onComplete({
      sectorPreferences: {
        prefer: preferredSectors,
        avoid: avoidedSectors,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">
          Sector Preferences
        </h3>
        <p className="text-sm text-muted-foreground">
          选择您偏好或希望避免的行业
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          This helps tailor investment recommendations to your interests
        </p>
        <p className="text-sm text-muted-foreground">
          这有助于根据您的兴趣定制投资建议
        </p>
      </div>

      {/* Summary Badges */}
      {(preferredSectors.length > 0 || avoidedSectors.length > 0) && (
        <Card className="p-4">
          <div className="space-y-3">
            {preferredSectors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Preferred / 偏好 ({preferredSectors.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {preferredSectors.map(id => {
                    const sector = SECTORS.find(s => s.id === id);
                    return sector ? (
                      <Badge key={id} variant="default" className="gap-1">
                        <span>{sector.icon}</span>
                        <span>{sector.nameZh}</span>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            {avoidedSectors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Avoided / 避免 ({avoidedSectors.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {avoidedSectors.map(id => {
                    const sector = SECTORS.find(s => s.id === id);
                    return sector ? (
                      <Badge key={id} variant="destructive" className="gap-1">
                        <span>{sector.icon}</span>
                        <span>{sector.nameZh}</span>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Sector Selection Tabs */}
      <Tabs defaultValue="prefer" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prefer">
            Prefer / 偏好 ({preferredSectors.length})
          </TabsTrigger>
          <TabsTrigger value="avoid">
            Avoid / 避免 ({avoidedSectors.length})
          </TabsTrigger>
        </TabsList>

        {/* Prefer Tab */}
        <TabsContent value="prefer" className="space-y-3 mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Select sectors you want to focus on / 选择您想要关注的行业
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SECTORS.map((sector) => {
              const isPreferred = preferredSectors.includes(sector.id);
              const isAvoided = avoidedSectors.includes(sector.id);

              return (
                <div
                  key={sector.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50 ${
                    isPreferred
                      ? 'border-primary bg-primary/5'
                      : isAvoided
                      ? 'border-destructive/30 bg-destructive/5 opacity-50'
                      : 'border-border'
                  }`}
                  onClick={() => handleTogglePrefer(sector.id)}
                >
                  <Checkbox
                    id={`prefer-${sector.id}`}
                    checked={isPreferred}
                    disabled={isAvoided}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`prefer-${sector.id}`}
                      className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                    >
                      <span className="text-xl">{sector.icon}</span>
                      <span>{sector.nameZh}</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sector.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Avoid Tab */}
        <TabsContent value="avoid" className="space-y-3 mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Select sectors you want to avoid / 选择您想要避免的行业
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SECTORS.map((sector) => {
              const isPreferred = preferredSectors.includes(sector.id);
              const isAvoided = avoidedSectors.includes(sector.id);

              return (
                <div
                  key={sector.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:border-destructive/50 ${
                    isAvoided
                      ? 'border-destructive bg-destructive/5'
                      : isPreferred
                      ? 'border-primary/30 bg-primary/5 opacity-50'
                      : 'border-border'
                  }`}
                  onClick={() => handleToggleAvoid(sector.id)}
                >
                  <Checkbox
                    id={`avoid-${sector.id}`}
                    checked={isAvoided}
                    disabled={isPreferred}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`avoid-${sector.id}`}
                      className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                    >
                      <span className="text-xl">{sector.icon}</span>
                      <span>{sector.nameZh}</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sector.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-4">
        <p className="text-xs text-muted-foreground mb-4">
          You can skip this step if you don't have specific sector preferences
          <br />
          如果您没有特定的行业偏好，可以跳过此步骤
        </p>
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          {isPending ? 'Saving... / 保存中...' : 'Continue / 继续'}
        </Button>
      </div>
    </div>
  );
}
