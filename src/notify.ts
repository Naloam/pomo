import notifier from 'node-notifier';

/**
 * 发送专注完成的系统通知
 */
export function notifyFocusComplete(): void {
  notifier.notify({
    title: 'pomo',
    message: '\u{1F345} 专注完成！',
    sound: true,
    wait: false,
  });
}

/**
 * 发送休息结束的系统通知
 */
export function notifyBreakComplete(): void {
  notifier.notify({
    title: 'pomo',
    message: '☕ 休息结束',
    sound: true,
    wait: false,
  });
}
