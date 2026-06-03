import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node-notifier', () => ({
  default: {
    notify: vi.fn(),
  },
}));

import notifier from 'node-notifier';
import { notifyFocusComplete, notifyBreakComplete } from './notify.js';

describe('notifyFocusComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call notifier.notify with focus complete message', () => {
    notifyFocusComplete();
    expect(notifier.notify).toHaveBeenCalledWith({
      title: 'pomo',
      message: '\u{1F345} 专注完成！',
      sound: true,
      wait: false,
    });
  });

  it('should call notifier.notify exactly once', () => {
    notifyFocusComplete();
    expect(notifier.notify).toHaveBeenCalledTimes(1);
  });
});

describe('notifyBreakComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call notifier.notify with break complete message', () => {
    notifyBreakComplete();
    expect(notifier.notify).toHaveBeenCalledWith({
      title: 'pomo',
      message: '☕ 休息结束',
      sound: true,
      wait: false,
    });
  });

  it('should call notifier.notify exactly once', () => {
    notifyBreakComplete();
    expect(notifier.notify).toHaveBeenCalledTimes(1);
  });
});
