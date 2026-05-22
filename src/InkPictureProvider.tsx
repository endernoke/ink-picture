import { useStdin } from "ink";
import checkIsUnicodeSupported from "is-unicode-supported";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import supportsColor from "supports-color";
import { type Config, setConfig } from "./config.js";
import {
  defaultTerminalInfo,
  supportsITerm2,
  type TerminalInfo,
  TerminalInfoContext,
  useTerminalInfo,
} from "./context/TerminalInfo.js";
import { queryTerminal } from "./utils/queryTerminal.js";

function resolveNumber(
  key: string,
  propValue: number | undefined,
  fallback: number,
  min: number,
): number {
  const env = process.env[key];
  if (env !== undefined) {
    const n = parseInt(env, 10);
    if (Number.isFinite(n) && n >= min) return n;
  }
  if (propValue !== undefined) return Math.max(min, propValue);
  return fallback;
}

export type InkPictureConfig = Config;

const defaultConfig: InkPictureConfig = {
  pollInterval: 16,
  positionPollInterval: 16,
  cacheSize: 10,
};

const InkPictureConfigContext = createContext<InkPictureConfig>(defaultConfig);

export function useInkPictureConfig(): InkPictureConfig {
  return useContext(InkPictureConfigContext);
}

interface InkPictureProviderProps {
  children: React.ReactNode;
  config?: Partial<InkPictureConfig>;
  terminalInfo?: Partial<TerminalInfo>;
  onDetection?: (terminalInfo: TerminalInfo) => void;
}

export function InkPictureProvider({
  children,
  config,
  terminalInfo: overrides,
  onDetection,
}: InkPictureProviderProps) {
  const { stdin, setRawMode } = useStdin();
  const [terminalInfo, setTerminalInfo] = useState<TerminalInfo | undefined>(
    undefined,
  );

  const resolvedConfig: InkPictureConfig = useMemo(() => {
    const c: InkPictureConfig = {
      pollInterval: resolveNumber(
        "INK_PICTURE_POLL_INTERVAL",
        config?.pollInterval,
        16,
        1,
      ),
      positionPollInterval: resolveNumber(
        "INK_PICTURE_POSITION_POLL_INTERVAL",
        config?.positionPollInterval,
        16,
        1,
      ),
      cacheSize: resolveNumber(
        "INK_PICTURE_CACHE_SIZE",
        config?.cacheSize,
        10,
        0,
      ),
    };
    setConfig(c);
    return c;
  }, [config]);

  useEffect(() => {
    const controller = new AbortController();

    const queryTerminalInfo = async () => {
      const result = await queryTerminal(stdin, setRawMode, controller.signal);

      const info = { ...defaultTerminalInfo, ...overrides };

      if (result.cellWidth && result.cellHeight) {
        info.cellWidth = result.cellWidth;
        info.cellHeight = result.cellHeight;
      } else if (result.terminalWidth && result.terminalHeight) {
        info.cellWidth = result.terminalWidth / process.stdout.columns;
        info.cellHeight = result.terminalHeight / process.stdout.rows;
      }

      info.supportsUnicode = checkIsUnicodeSupported();
      info.supportsColor = !!supportsColor.stdout;

      const supportsITerm2Graphics = supportsITerm2({
        hasITermCellSizeResponse: result.iterm2CellWidth !== undefined,
        supportsSixelGraphics: result.supportsSixelGraphics,
      });
      info.supportsSixelGraphics = result.supportsSixelGraphics;
      info.supportsKittyGraphics = result.supportsKittyGraphics;
      info.supportsITerm2Graphics = supportsITerm2Graphics;

      // Apply iTerm2 cell size override for HiDPI scaling
      // See https://iterm2.com/documentation-escape-codes.html#report-cell-size
      if (
        result.iterm2CellWidth !== undefined &&
        result.iterm2CellHeight !== undefined &&
        result.iterm2Scale !== undefined
      ) {
        info.cellWidth = result.iterm2CellWidth * result.iterm2Scale;
        info.cellHeight = result.iterm2CellHeight * result.iterm2Scale;
        info.terminalWidth = info.cellWidth * process.stdout.columns;
        info.terminalHeight = info.cellHeight * process.stdout.rows;
      }
      setTerminalInfo(info);
      onDetection?.(info);
    };
    queryTerminalInfo();

    return () => controller.abort();
  }, [stdin, setRawMode, overrides, onDetection]);

  const resolvedInfo = useMemo(
    () => ({ ...defaultTerminalInfo, ...terminalInfo, ...overrides }),
    [terminalInfo, overrides],
  );

  if (!terminalInfo && !overrides) {
    return null;
  }

  return (
    <InkPictureConfigContext.Provider value={resolvedConfig}>
      <TerminalInfoContext.Provider value={resolvedInfo}>
        {children}
      </TerminalInfoContext.Provider>
    </InkPictureConfigContext.Provider>
  );
}

export const TerminalInfoProvider = InkPictureProvider;
