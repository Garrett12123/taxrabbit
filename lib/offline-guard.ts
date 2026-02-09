let installed = false;

export function installOfflineGuard() {
  if (installed) return;
  installed = true;

  const originalFetch = globalThis.fetch;

  globalThis.fetch = function patchedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url =
      input instanceof Request
        ? input.url
        : input instanceof URL
          ? input.href
          : String(input);

    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsed = new URL(url);
      const hostname = parsed.hostname;

      if (
        hostname !== 'localhost' &&
        hostname !== '127.0.0.1' &&
        hostname !== '[::1]'
      ) {
        throw new Error(
          `[offline-guard] External network request blocked: ${url}. ` +
            'TaxRabbit is designed to run fully offline. ' +
            'Only requests to localhost are allowed.'
        );
      }
    }

    return originalFetch.call(globalThis, input, init);
  };
}
