import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const folder = 'test-results/screenshots';
test.beforeEach(async ({page},testInfo) => {
  await page.goto('/');
  await expect(page.getByText(/WELCOME HOME|Welcome to/).first()).toBeVisible();
  if(testInfo.title.includes('first-run onboarding'))return;
  const skip=page.getByRole('button',{name:'Skip welcome guide'});
  if(await skip.count())await skip.click();
  await expect(page.getByText(/Welcome to/).first()).toBeVisible();
});
test('official content, dark default and persistent theme toggle', async ({page},testInfo) => {
  await expect(page.getByText('Solid Rock Dublin').first()).toBeVisible();
  await expect(page.getByText(/Sunday worship · 11:00 am/).first()).toBeVisible();
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
    ['Watch','Watch & grow'],['Community','Together is better.'],['Events','Gather together'],['More','More to explore'],
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

test('watch feature uses readable contrast on dark theme', async ({page}) => {
  await page.getByRole('tab',{name:'Watch',exact:true}).click();
  const title=page.getByText(/Worship, wherever you are|Watch Sunday service live/).first();
  await expect(title).toBeVisible();
  await expect(title).toHaveCSS('color','rgb(255, 255, 255)');
});
test('local data deletion requires confirmation and resets preferences', async ({page}) => {
  await page.getByRole('tab',{name:'Watch',exact:true}).click();
  await page.getByRole('button',{name:'☆ Save reading guide'}).first().click();
  await page.getByRole('tab',{name:'More',exact:true}).click();
  await page.getByRole('button',{name:/Privacy and your data/}).click();
  await page.getByRole('button',{name:'Clear locally saved preferences'}).click();
  await expect(page.getByRole('button',{name:'Keep my saved data'})).toBeVisible();
  await page.getByRole('button',{name:'Yes, clear this device'}).click();
  await page.reload();
  await page.getByRole('tab',{name:'Watch',exact:true}).click();
  await expect(page.getByText('★ Saved to this device')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Switch to light mode'})).toBeVisible();
});

test('church YouTube player, playlist and Instagram fallback',async ({page})=>{
  await page.getByRole('tab',{name:'Watch',exact:true}).click();
  await expect(page.getByText('SOLID ROCK CENTRE TV')).toBeVisible();
  await expect(page.getByTitle('Solid Rock Centre official YouTube player')).toBeVisible();
  await page.getByRole('button',{name:'Playlists',exact:true}).click();
  await expect(page.getByText('Official YouTube playlists')).toBeVisible();
  await page.getByRole('button',{name:'▶ Play playlist in app'}).first().click();
  await expect(page.getByTitle('Solid Rock Centre official YouTube player')).toBeVisible();
  await page.getByRole('tab',{name:'Home',exact:true}).click();
  await expect(page.getByText('From our community')).toBeVisible();
  await expect(page.getByText('Follow Solid Rock Centre')).toBeVisible();
});
test('ministry photography and official accounts have accessible navigation',async ({page})=>{
  await expect(page.getByText('Food Bank')).toBeVisible();
  await expect(page.getByText('Youth Sunday School')).toBeVisible();
  await expect(page.getByText('Spirituality')).toBeVisible();
  await expect(page.getByText('From our community')).toBeVisible();
});

test('first-run onboarding introduces guest-first community and remembers completion',async ({page},testInfo)=>{
 await expect(page.getByText('A community beyond Sunday.')).toBeVisible();
 await page.getByRole('button',{name:'Next welcome step'}).click();
 await expect(page.getByText('Find what matters to you.')).toBeVisible();
 await page.getByRole('button',{name:'Next welcome step'}).click();
 await expect(page.getByText('Connection with boundaries.')).toBeVisible();
 await page.getByRole('radio',{name:'Find community'}).click();
 await page.getByRole('button',{name:'Enter Solid Rock app'}).click();
 await expect(page.getByText('Together is better.')).toBeVisible();
 mkdirSync(folder,{recursive:true});
 await page.screenshot({path:`${folder}/${testInfo.project.name}-community-dark.png`});
 await page.reload();
 await expect(page.getByRole('button',{name:'Skip welcome guide'})).toHaveCount(0);
 await expect(page.getByRole('tab',{name:'Home'})).toBeVisible();
});
test('community guest can inspect five channel topics without seeing fabricated posts',async ({page},testInfo)=>{
 await page.getByRole('tab',{name:'Community',exact:true}).click();
 await expect(page.getByText('Together is better.')).toBeVisible();
 for(const heading of ['Church updates','Prayer circle','Faith & life','Scripture together','Serve together'])
   await expect(page.getByText(heading)).toBeVisible();
 await page.getByRole('button',{name:'Open Prayer circle'}).click();
 await expect(page.getByText('A space to grow together')).toBeVisible();
 await expect(page.getByText(/No sample posts/)).toBeVisible();
 await expect(page.getByRole('textbox',{name:/Message to/})).toHaveCount(0);
 mkdirSync(folder,{recursive:true});
 await page.screenshot({path:`${folder}/${testInfo.project.name}-prayer-circle-preview.png`});
 await page.getByRole('button',{name:'Back to community channels'}).click();
 await expect(page.getByText('Together is better.')).toBeVisible();
});
test('giving stays available through More instead of occupying a tab',async ({page})=>{
 await page.getByRole('tab',{name:'More'}).click();
 await page.getByRole('button',{name:/^Giving/}).click();
 await expect(page.getByText('A heart of generosity')).toBeVisible();
});
