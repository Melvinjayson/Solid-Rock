import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const folder = 'test-results/screenshots';
test.beforeEach(async ({page}) => {
  await page.goto('/');
  await expect(page.getByText(/Welcome to/).first()).toBeVisible();
});
test('official content, dark default and persistent theme toggle', async ({page},testInfo) => {
  await expect(page.getByText('Solid Rock Dublin').first()).toBeVisible();
  await expect(page.getByText(/Sunday worship · 11:00 am/)).toBeVisible();
  await expect(page.getByRole('button',{name:'Switch to light mode'})).toBeVisible();
  await page.getByRole('button',{name:'Switch to light mode'}).click();
  await expect(page.getByRole('button',{name:'Switch to dark mode'})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button',{name:'Switch to dark mode'})).toBeVisible();
  await page.getByRole('button',{name:'Switch to dark mode'}).click();
  mkdirSync(folder,{recursive:true});
  await page.screenshot({path:`${folder}/${testInfo.project.name}-home-dark.png`,fullPage:false});
});
test('five core tabs are visible and navigable', async ({page},testInfo) => {
  mkdirSync(folder,{recursive:true});
  for(const [tab,heading] of [
    ['Watch','Watch & grow'],['Events','Gather together'],['Give','A heart of generosity'],['More','More to explore'],
  ] as const){
    await page.getByRole('tab',{name:tab,exact:true}).click();
    await expect(page.getByText(heading)).toBeVisible();
    await page.screenshot({path:`${folder}/${testInfo.project.name}-${tab.toLowerCase()}-dark.png`,fullPage:false});
  }
});
test('member hub gracefully degrades when backend is unavailable', async ({page},testInfo) => {
  await page.getByRole('tab',{name:'More',exact:true}).click();
  await page.getByRole('button',{name:/Church hub/}).click();
  await expect(page.getByText('Church community')).toBeVisible();
  await expect(page.getByText('Offline experience')).toBeVisible();
  mkdirSync(folder,{recursive:true});
  await page.screenshot({path:`${folder}/${testInfo.project.name}-church-hub-dark.png`,fullPage:false});
});
test('study-guide search and local bookmark persist without login', async ({page}) => {
  await page.getByRole('tab',{name:'Watch',exact:true}).click();
  await page.getByRole('textbox',{name:'Search study guides'}).fill('Ephesians');
  await expect(page.getByText('Grace for everyday life')).toBeVisible();
  await expect(page.getByText('Rooted in faith')).toHaveCount(0);
  await page.getByRole('button',{name:'☆ Save reading guide'}).click();
  await page.reload();
  await page.getByRole('tab',{name:'Watch',exact:true}).click();
  await expect(page.getByText(/Saved to this device/)).toBeVisible();
});
