import { describe, expect, it } from "vitest";
import { renderITerm2 } from "../../../src/renderers/iterm2.js";

describe("renderITerm2", () => {
  it("produces valid iTerm2 escape sequence", () => {
    const png = {
      data: Buffer.from("fake-png-data"),
      info: { width: 100, height: 200 },
    };
    const result = renderITerm2(png, { width: 100, height: 200 });

    expect(result).toContain("\x1b]1337;File=");
    expect(result).toContain(`size=${png.data.length}`);
    expect(result).toContain("width=100px");
    expect(result).toContain("height=200px");
    expect(result).toContain("preserveAspectRatio=1");
    expect(result).toContain("inline=1:");
    expect(result).toContain(png.data.toString("base64"));
    expect(result).toContain("\x07");
  });
});
