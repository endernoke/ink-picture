/**
 * Send a message to stdout and wait for a response from stdin.
 * Meant for getting replies from control sequences
 * This should NOT be used for getting user input.
 */
function queryEscapeSequence(
  message: string,
  options: { stdout: NodeJS.WriteStream; stdin: NodeJS.ReadStream } = process,
) {
  return new Promise<string | undefined>((resolve) => {
    const { stdin, stdout } = options;

    const responseTimeout = 100;
    let responseTimeoutId: NodeJS.Timeout | undefined = undefined;
    const timeoutBetweenReplies = 50;
    let timeoutBetweenRepliesId: NodeJS.Timeout | undefined = undefined;
    let runningReply = "";

    const wasRaw = stdin.isRaw;
    // if Ink has not already set raw mode and it supports raw, enable it
    if (!wasRaw && stdin.isTTY) {
      stdin.setRawMode(true);
    }

    const restoreState = () => {
      if (stdin.isTTY) {
        stdin.setRawMode(wasRaw);
      }

      // remove listeners
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
