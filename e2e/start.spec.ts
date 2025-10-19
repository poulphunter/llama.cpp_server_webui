import { test, expect } from '@playwright/test';

function error_def(page) {
  const consoleErrors: unknown[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  return consoleErrors;
}
test('check title', async ({ page }) => {
  const consoleErrors: unknown[] = error_def(page);
  await page.goto('');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/llama.cpp - chat/);
  expect(consoleErrors).toEqual([]);
});

test('Verify Main Page UI Elements and Default Values', async ({ page }) => {
  const consoleErrors: unknown[] = error_def(page);
  await page.goto('');
  await page.getByText('llama.cpp').click();
  await expect(
    page.locator('div').filter({ hasText: /^Settings$/ })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Conversations' })
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Type a message (Shift+Enter' })
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Default: 0.8' })).toHaveValue(
    '0.8'
  );
  await expect(
    page.getByRole('textbox', { name: 'Default: 1.75' })
  ).toHaveValue('1.75');
  expect(consoleErrors).toEqual([]);
});

test('test chat', async ({ page }) => {
  const consoleErrors: unknown[] = error_def(page);
  await page.goto('');
  await page
    .getByRole('textbox', { name: 'Type a message (Shift+Enter' })
    .click();
  await page
    .getByRole('textbox', { name: 'Type a message (Shift+Enter' })
    .fill('test');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.locator('#messages-list')).toContainText(
    'Hello! It seems like you sent a "test" message. Could you please clarify what you need help with? I\'m here to assist with any questions or tasks you have! 😊'
  );
  await expect(page.locator('#messages-list')).toContainText('🔄 Regenerate');
  await expect(page.locator('#messages-list')).toContainText('📋 Copy');
  expect(consoleErrors).toEqual([]);
});
