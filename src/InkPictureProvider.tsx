import { useStdin } from "ink";
import checkIsUnicodeSupported from "is-unicode-supported";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import supportsColor from "supports-color";
import {
  defaultTerminalInfo,
  supportsITerm2,
  type TerminalInfo,
  TerminalInfoContext,
  useTerminalInfo,
} from "./context/TerminalInfo.js";
import { ImageCache } from "./utils/imageCache.js";
import { queryTerminal } from "./utils/queryTerminal.js";

function resolveConfig(
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

export interface InkPictureConfig {
  pollIntervalMs: number;
  paintIntervalMs: number;
  cacheSize: number;
}

const defaultConfig: InkPictureConfig = {
  pollIntervalMs: 16,
  paintIntervalMs: 16,
  cacheSize: 10,
};

const InkPictureConfigContext = createContext<InkPictureConfig>(defaultConfig);

export function useInkPictureConfig(): InkPictureConfig {
  return useContext(InkPictureConfigContext);
}

const ImageCacheContext = createContext<ImageCache | null>(null);

export function useImageCache(): ImageCache | null {
  return useContext(ImageCacheContext);
}

interface InkPictureProviderProps {
  children: React.ReactNode;
  config?: Partial<InkPictureConfig>;
  terminalInfo?: Partial<TerminalInfo>;
  onTerminalInfoDetection?: (terminalInfo: TerminalInfo) => void;
}

export function InkPictureProvider({
  children,
  config,
  terminalInfo: overrides,
  onTerminalInfoDetection,
}: InkPictureProviderProps) {
  const { stdin, setRawMode } = useStdin();
  const [terminalInfo, setTerminalInfo] = useState<TerminalInfo | undefined>(
    undefined,
  );

  const resolvedConfig: InkPictureConfig = useMemo(() => {
    const c: InkPictureConfig = {
      pollIntervalMs: resolveConfig(
        "INK_PICTURE_POLL_INTERVAL",
        config?.pollIntervalMs,
        16,
        1,
      ),
      paintIntervalMs: resolveConfig(
        "INK_PICTURE_PAINT_INTERVAL",
        config?.paintIntervalMs,
        16,
        1,
      ),
      cacheSize: resolveConfig(
        "INK_PICTURE_CACHE_SIZE",
        config?.cacheSize,
        10,
        0,
      ),
    };
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
      onTerminalInfoDetection?.(info);
    };
    queryTerminalInfo();

    return () => controller.abort();
  }, [stdin, setRawMode, overrides, onTerminalInfoDetection]);

  const resolvedInfo = useMemo(
    () => ({ ...defaultTerminalInfo, ...terminalInfo, ...overrides }),
    [terminalInfo, overrides],
  );

  const { current: cache } = useRef(
    resolvedConfig.cacheSize === 0
      ? null
      : new ImageCache(resolvedConfig.cacheSize),
  );

  if (!terminalInfo && !overrides) {
    return null;
  }

  return (
    <InkPictureConfigContext.Provider value={resolvedConfig}>
      <ImageCacheContext.Provider value={cache}>
        <TerminalInfoContext.Provider value={resolvedInfo}>
          {children}
        </TerminalInfoContext.Provider>
      </ImageCacheContext.Provider>
    </InkPictureConfigContext.Provider>
  );
}

export const TerminalInfoProvider = InkPictureProvider;
