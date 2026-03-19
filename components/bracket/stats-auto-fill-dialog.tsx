"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  STAT_CATEGORIES,
  PRESETS,
  type PresetName,
  type StatWeights,
  type ChaosLevel,
  type StatsAutoFillConfig,
} from "@/lib/bracket-auto-fill";

const LOCAL_STORAGE_KEY = "bracketiering-stats-autofill-config";

const STAT_GROUPS = STAT_CATEGORIES.reduce(
  (acc, cat) => {
    if (!acc[cat.group]) acc[cat.group] = [];
    acc[cat.group].push(cat);
    return acc;
  },
  {} as Record<string, typeof STAT_CATEGORIES>,
);

interface SavedConfig {
  preset: PresetName | "custom";
  weights: StatWeights;
  chaosLevel: ChaosLevel;
}

const VALID_PRESETS = new Set<string>([
  "offense_heavy",
  "defense_heavy",
  "balanced",
  "rebounding_hustle",
  "bpi_focused",
  "strength_focused",
  "analytics_combined",
  "custom",
]);
const VALID_CHAOS_LEVELS = new Set<string>(["none", "low", "medium", "high"]);
const WEIGHT_KEYS: (keyof StatWeights)[] = [
  "winPct",
  "ppg",
  "oppPpg",
  "fgPct",
  "threePtPct",
  "ftPct",
  "reboundsPerGame",
  "assistsPerGame",
  "stealsPerGame",
  "blocksPerGame",
  "turnoversPerGame",
  "bpiOffense",
  "bpiDefense",
  "strengthOfSchedule",
  "strengthOfRecord",
];

const DEFAULT_CONFIG: SavedConfig = {
  preset: "balanced",
  weights: { ...PRESETS.balanced.weights },
  chaosLevel: "none",
};

function isValidSavedConfig(data: unknown): data is SavedConfig {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (!VALID_PRESETS.has(obj.preset as string)) return false;
  if (!VALID_CHAOS_LEVELS.has(obj.chaosLevel as string)) return false;
  if (typeof obj.weights !== "object" || obj.weights === null) return false;
  const w = obj.weights as Record<string, unknown>;
  return WEIGHT_KEYS.every(
    (k) => typeof w[k] === "number" && w[k] >= 0 && w[k] <= 10,
  );
}

function loadSavedConfig(): SavedConfig {
  if (typeof window === "undefined") {
    return { ...DEFAULT_CONFIG, weights: { ...DEFAULT_CONFIG.weights } };
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidSavedConfig(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return { ...DEFAULT_CONFIG, weights: { ...DEFAULT_CONFIG.weights } };
}

function saveConfig(config: SavedConfig) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
}

interface StatsAutoFillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (config: StatsAutoFillConfig) => void;
  isPending: boolean;
}

export function StatsAutoFillDialog({
  open,
  onOpenChange,
  onGenerate,
  isPending,
}: StatsAutoFillDialogProps) {
  const [savedConfig] = useState(loadSavedConfig);
  const [preset, setPreset] = useState<PresetName | "custom">(
    savedConfig.preset,
  );
  const [weights, setWeights] = useState<StatWeights>(savedConfig.weights);
  const [chaosLevel, setChaosLevel] = useState<ChaosLevel>(
    savedConfig.chaosLevel,
  );

  const handlePresetChange = useCallback((value: string) => {
    const presetName = value as PresetName | "custom";
    setPreset(presetName);
    if (presetName !== "custom") {
      setWeights({ ...PRESETS[presetName].weights });
    }
  }, []);

  const handleWeightChange = useCallback(
    (key: keyof StatWeights, value: number) => {
      setWeights((prev) => {
        const next = { ...prev, [key]: value };
        // Check if weights still match a preset
        const matchingPreset = (
          Object.entries(PRESETS) as [
            PresetName,
            (typeof PRESETS)[PresetName],
          ][]
        ).find(([, p]) =>
          (Object.keys(p.weights) as (keyof StatWeights)[]).every(
            (k) => p.weights[k] === next[k],
          ),
        );
        setPreset(matchingPreset ? matchingPreset[0] : "custom");
        return next;
      });
    },
    [],
  );

  function handleGenerate() {
    const config: StatsAutoFillConfig = { weights, chaosLevel };
    saveConfig({ preset, weights, chaosLevel });
    onGenerate(config);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stats-Based Auto-Fill</DialogTitle>
        </DialogHeader>

        {/* Preset selector */}
        <div className="space-y-2">
          <Label>Preset</Label>
          <Select value={preset} onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(PRESETS) as [
                  PresetName,
                  (typeof PRESETS)[PresetName],
                ][]
              ).map(([key, p]) => (
                <SelectItem key={key} value={key}>
                  {p.label}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chaos level */}
        <div className="space-y-2">
          <Label>Chaos Level (Upset Probability)</Label>
          <Select
            value={chaosLevel}
            onValueChange={(v) => setChaosLevel(v as ChaosLevel)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (pure stats)</SelectItem>
              <SelectItem value="low">Low (5% upsets)</SelectItem>
              <SelectItem value="medium">Medium (20% upsets)</SelectItem>
              <SelectItem value="high">High (40% upsets)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stat weight sliders */}
        <div className="space-y-4">
          <Label>Stat Weights</Label>
          {Object.entries(STAT_GROUPS).map(([groupName, cats]) => (
            <div key={groupName} className="space-y-3">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {groupName}
              </div>
              {cats.map((cat) => (
                <div key={cat.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{cat.fullLabel}</span>
                    <span className="w-6 text-right tabular-nums text-muted-foreground">
                      {weights[cat.key]}
                    </span>
                  </div>
                  <Slider
                    value={[weights[cat.key]]}
                    onValueChange={([v]) => handleWeightChange(cat.key, v)}
                    min={0}
                    max={10}
                    step={1}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? "Generating..." : "Generate Bracket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
