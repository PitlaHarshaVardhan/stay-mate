import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

describe('password reset API', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('aborts a stalled reset request so the page can show a timeout error', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('The operation was aborted.', 'AbortError')),
          { once: true },
        );
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = api.requestPasswordReset('qa@example.com');
    const rejected = expect(request).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(12_000);

    await rejected;
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
