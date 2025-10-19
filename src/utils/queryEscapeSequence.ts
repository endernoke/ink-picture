/**
 * Send a message to stdout and wait for a response from stdin.
 * Meant for getting replies from control sequences
 * This should NOT be used for getting user input.
 *
 * @param message The message to send to stdout.
 * @param stdin The stdin stream to read the response from, this should be from Ink's useStdin.
 * @param stdout The stdout stream to send the message to, this should be from Ink's useStdout.
 * @returns A promise that resolves with the response string, or undefined if no response is received within the timeout.
 *
 * @note Ink's own stdin/stdout handles Ctrl+C and other signals while enabling raw mode used by useInput, if you use process.stdin/process.stdout you will break one of those
 */
function queryEscapeSequence(
  message: string,
  stdin: NodeJS.ReadStream,
  stdout: NodeJS.WriteStream,
  setRawMode: (value: boolean) => void,
) {
  return new Promise<string | undefined>((resolve) => {
    const responseTimeout = 100;
    let responseTimeoutId: NodeJS.Timeout | undefined = undefined;
    const timeoutBetweenReplies = 50;
    let timeoutBetweenRepliesId: NodeJS.Timeout | undefined = undefined;
    let runningReply = "";

    setRawMode(true);

    const restoreState = () => {
      setRawMode(false);
      stdin.removeListener("data", onData);
      stdin.removeListener("close", onClose);

      if (responseTimeoutId !== undefined) {
        clearTimeout(responseTimeoutId);
      }
      if (timeoutBetweenRepliesId !== undefined) {
        clearTimeout(timeoutBetweenRepliesId);
      }
    };

    const onData = (data: string) => {
      if (responseTimeoutId !== undefined) {
        clearTimeout(responseTimeoutId);
      }
      if (timeoutBetweenRepliesId !== undefined) {
        clearTimeout(timeoutBetweenRepliesId);
      }
      runningReply += data;
      timeoutBetweenRepliesId = setTimeout(() => {
        restoreState();
        resolve(runningReply.length > 0 ? runningReply : undefined);
      }, timeoutBetweenReplies);
    };

    const onClose = () => {
      restoreState();
      resolve(runningReply.length > 0 ? runningReply : undefined);
    };

    stdin.on("data", onData);
    stdin.on("close", onClose);

    responseTimeoutId = setTimeout(() => {
      restoreState();
      resolve(undefined);
    }, responseTimeout);

    stdout.write(message);
  });
}

export default queryEscapeSequence;
