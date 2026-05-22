import { useStdin } from "ink";
import checkIsUnicodeSupported from "is-unicode-supported";
import iterm2Version from "iterm2-version";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import supportsColor from "supports-color";
import { queryTerminal } from "../utils/queryTerminal.js";

export function supportsITerm2(context?: {
  supportsSixelGraphics: boolean;
  hasITermCellSizeResponse: boolean;
}) {
  if (context?.hasITermCellSizeResponse) return true;
  if (process.env.TERM_PROGRAM === "iTerm.app") {
    const version = iterm2Version();
    if (!version || Number(version[0]) < 3) return false;
    return true;
  } else if (process.env.TERM_PROGRAM === "WezTerm") {
    // WezTerm is compatible with iTerm2 inline images starting from version 20220319-142410-0fcdea07
    // See https://wezterm.org/imgcat.html
    const version = process.env.TERM_PROGRAM_VERSION;
    if (!version) return false;
    const date = parseInt(version.split("-")[0], 10);
    if (!Number.isNaN(date) && date >= 20220319) {
      return true;
    }
  } else if (process.env.KONSOLE_VERSION) {
    // Konsole supports iTerm2 inline images since some time around 2022
    // See https://www.reddit.com/r/kde/comments/ul0irg/konsole_2204_with_sixel_support_is_out_of_beta_now/
    const version = process.env.KONSOLE_VERSION;
    if (!version) return false;
    const date = parseInt(version, 10);
    if (!Number.isNaN(date) && date >= 220400) {
      return true;
    }
  } else if (process.env.TERM_PROGRAM === "rio") {
    // Rio terminal supports iTerm2 inline images since version 0.1.13
    // See https://github.com/raphamorim/rio/releases/tag/v0.1.13
    const version = process.env.TERM_PROGRAM_VERSION;
    if (!version) return false;
    const [major, minor, patch] = version
      .split(".")
      .map((v) => parseInt(v, 10));
    if (
      !Number.isNaN(major) &&
      !Number.isNaN(minor) &&
      !Number.isNaN(patch) &&
      (major > 0 ||
        (major === 0 && minor > 1) ||
        (major === 0 && minor === 1 && patch >= 13))
    ) {
      return true;
    }
  } else if (process.env.TERM_PROGRAM === "vscode") {
    // VS Code's integrated terminal can be configured to support Sixel and iTerm2 graphics
    // If Sixel is supported, iTerm2 images are also supported
    if (context?.supportsSixelGraphics) {
      return true;
    }
  } else if (process.env.TERM_PROGRAM === "WarpTerminal") {
    const version = process.env.TERM_PROGRAM_VERSION;
    // Supported since v0.2025.03.05.08.02
    // See https://docs.warp.dev/getting-started/changelog
    if (version) {
      const [, year, month, day] = version
        .slice(1)
        .split(".")
        .map((v) => parseInt(v, 10));
      if (
        !Number.isNaN(year) &&
        !Number.isNaN(month) &&
        !Number.isNaN(day) &&
        (year > 2025 ||
          (year === 2025 && month > 3) ||
          (year === 2025 && month === 3 && day >= 5))
      ) {
        return true;
      }
    }
  }
  return false;
}

export interface TerminalInfo {
  /** Terminal viewport width in pixels */
  terminalWidth: number;
  /** Terminal viewport height in pixels */
  terminalHeight: number;
  /** Width of a single character cell in pixels */
  cellWidth: number;
  /** Height of a single character cell in pixels */
  cellHeight: number;
  /** Whether the terminal supports Unicode characters */
  supportsUnicode: boolean;
  /** Whether the terminal supports color output */
  supportsColor: boolean;
  /** Whether the terminal supports Sixel graphics protocol */
  supportsSixelGraphics: boolean;
  /** Whether the terminal supports Kitty graphics protocol */
  supportsKittyGraphics: boolean;
  /** Whether the terminal supports iTerm2 inline images */
  supportsITerm2Graphics: boolean;
}

export const defaultTerminalInfo: TerminalInfo = {
  terminalWidth: 6 * process.stdout.columns,
  terminalHeight: 12 * process.stdout.rows,
  cellWidth: 6,
  cellHeight: 12,
  supportsUnicode: false,
  supportsColor: false,
  supportsSixelGraphics: false,
  supportsKittyGraphics: false,
  supportsITerm2Graphics: false,
};

/**
 * React context for sharing terminal information throughout the component tree.
 *
 * This context provides terminal dimensions and capabilities to child components.
 * It is undefined until the TerminalInfoProvider completes its initialization.
 * @todo maybe use a state management solution instead
 */
export const TerminalInfoContext = createContext<TerminalInfo | undefined>(
  undefined,
);

/**
 * TerminalInfo Provider Component
 *
 * This provider component must wrap any components that need terminal information,
 * including the Image component and any other components that depend on terminal
 * capabilities or dimensions.
 *
 * **Usage:**
 * ```tsx
 * import { TerminalInfoProvider } from './context/TerminalInfo.js';
 * import Image from './components/image/index.js';
 *
 * function App() {
 *   return (
 *     <TerminalInfoProvider>
 *       <Image src="image.jpg" />
 *       // Other components that need terminal info
 *     </TerminalInfoProvider>
 *   );
 * }
 * ```
 *
 * @param props - Component props
 * @param props.children - Child components that will have access to terminal info
 * @param props.terminalInfo - Optional terminal info overrides
 * @param props.onDetection - Optional callback that receives the detected terminal info once available
 * @returns JSX element providing terminal information context
 */
export const TerminalInfoProvider = ({
  children,
  terminalInfo: overrides,
  onDetection,
}: {
  children: React.ReactNode;
  terminalInfo?: Partial<TerminalInfo>;
  onDetection?: (terminalInfo: TerminalInfo) => void;
}) => {
  const { stdin, setRawMode } = useStdin();
  const [terminalInfo, setTerminalInfo] = useState<TerminalInfo | undefined>(
    undefined,
  );

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

  return (
    <TerminalInfoContext.Provider value={resolvedInfo}>
      {terminalInfo ? children : null}
    </TerminalInfoContext.Provider>
  );
};

/**
 * Hook to access complete terminal information.
 *
 * @returns TerminalInfo object with dimensions and capabilities, or undefined during initialization
 * @throws Error if not used within TerminalInfoProvider context (after 2-second timeout)
 */
export const useTerminalInfo = () => {
  const terminalInfo = useContext(TerminalInfoContext);

  return terminalInfo ?? defaultTerminalInfo;
};
