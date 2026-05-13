import chalk from "chalk";

const rgbRegex = /^rgb\(\s?(\d+),\s?(\d+),\s?(\d+)\s?\)$/;
const ansiRegex = /^ansi256\(\s?(\d+)\s?\)$/;

const isNamedColor = (color: string): color is keyof typeof chalk =>
  color in chalk;

export default function bgColorize(str: string, color: string): string {
  if (isNamedColor(color)) {
    const methodName = `bg${color[0].toUpperCase() + color.slice(1)}` as
      | keyof typeof chalk
      | undefined;
    if (methodName && methodName in chalk) {
      return (chalk[methodName] as (s: string) => string)(str);
    }

    return str;
  }

  if (color.startsWith("#")) {
    return chalk.bgHex(color)(str);
  }

  if (color.startsWith("ansi256")) {
    const matches = ansiRegex.exec(color);
    if (matches) {
      return chalk.bgAnsi256(Number(matches[1]))(str);
    }

    return str;
  }

  if (color.startsWith("rgb")) {
    const matches = rgbRegex.exec(color);
    if (matches) {
      return chalk.bgRgb(
        Number(matches[1]),
        Number(matches[2]),
        Number(matches[3]),
      )(str);
    }

    return str;
  }

  return str;
}
