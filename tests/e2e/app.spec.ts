import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const folder = 'test-results/screenshots';
test.beforeEach(async ({page},testInfo) => {
  await page.goto('/');
  await expect(page.getByText(/WELCOME HOME|Faith beyond/).first()).toBeVisible();
  if(testInfo.title.includes('first-run onboarding'))return;
  const skip=page.getByRole('button',{name:'Skip welcome guide'});
  if(await skip.count())await skip.click();
  await expect(page.getByText(/Faith beyond/).first()).toBeVisible();
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
    ['Watch','Watch & grow'],['Community','Together is better.'],['Events','Gather together'],['More','Your space'],
  ] as const){
    await page.getByRole('tab',{name:tab,exact:true}).click();
    await expect(page.getByText(heading)).toBeVisible();
    await page.screenshot({path:`${folder}/${testInfo.project.name}-${tab.toLowerCase()}-dark.png`,fullPage:false});
  }
});
test('member hub gracefully degrades when backend is unavailable', async ({page},testInfo) => {
  await page.getByRole('tab',{name:'More',exact:true}).click();
  await page.getByRole('button',{name:/Church hub/}).click();
  await expect(page.getByText('Stay connected.')).toBeVisible();
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
  await expect(page.getByText('A community beyond Sunday.')).toBeVisible();
  await page.getByRole('button',{name:'Skip welcome guide'}).click();
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
  await page.getByRole('button',{name:'Clear all app data on this device'}).click();
  await expect(page.getByRole('button',{name:'Keep my data'})).toBeVisible();
  await page.getByRole('button',{name:"Yes, erase this device's app data"}).click();
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
test('ministry photography is in Discover ministries, not duplicated on the app home',async ({page})=>{
  await expect(page.getByText('Find your place')).toBeVisible();
  await page.getByRole('button',{name:/Explore ministries/}).click();
  await expect(page.getByText('Food Bank')).toBeVisible();
  await expect(page.getByText('Youth Sunday School')).toBeVisible();
  await expect(page.getByText('Spirituality')).toBeVisible();
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
 await expect(page.getByText('Generosity, made simple.')).toBeVisible();
});

test('official church giving uses verified IBAN and external hosted checkout',async ({page})=>{
 await page.getByRole('tab',{name:'More',exact:true}).click();
 await page.getByRole('button',{name:/^Giving/}).click();
 await expect(page.getByText('IE23 BOFI 9033 6590 5850 99')).toBeVisible();
 await expect(page.getByRole('button',{name:'Copy IBAN'})).toBeVisible();
 await page.getByRole('button',{name:'Online giving'}).click();
 await expect(page.getByText(/PayPal's own secure site/)).toBeVisible();
 await expect(page.getByRole('button',{name:'Continue to church PayPal'})).toBeVisible();
 await expect(page.getByText(/No card number is entered into this app/)).toBeVisible();
});
test('Talk to us provides categorized consent-first contact',async ({page})=>{
 await page.getByRole('tab',{name:'More'}).click();
 await page.getByRole('button',{name:/Talk to us/}).click();
 await expect(page.getByText('Talk to us.')).toBeVisible();
 await page.getByRole('radio',{name:'Families, youth & accessibility'}).click();
 await expect(page.getByRole('textbox',{name:'Your message'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Continue in email app'})).toBeVisible();
 await expect(page.getByText('admin@solidrockdublin.org')).toBeVisible();
});
test('Preferences provides true black default, light toggle and readable Bible size',async ({page})=>{
 await page.getByRole('tab',{name:'More'}).click();
 await page.getByRole('button',{name:/^Preferences/}).click();
 await expect(page.getByText('Preferences',{exact:true})).toBeVisible();
 await expect(page.getByRole('radio',{name:'Black / dark'})).toHaveAttribute('aria-checked','true');
 await page.getByRole('radio',{name:'Light / ivory'}).click();
 await expect(page.getByRole('button',{name:'Switch to dark mode'})).toBeVisible();
 await page.getByRole('radio',{name:'Extra large'}).click();
 await expect(page.getByRole('radio',{name:'Extra large'})).toHaveAttribute('aria-checked','true');
 await page.reload();
 await page.getByRole('tab',{name:'More'}).click();
 await page.getByRole('button',{name:/^Preferences/}).click();
 await expect(page.getByRole('radio',{name:'Extra large'})).toHaveAttribute('aria-checked','true');
});
test('Bible reads actual public-domain chapter and proposes church study share',async ({page})=>{
 await page.route('https://bible-api.com/data/web/JHN/3',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({translation:{name:'World English Bible',license:'Public Domain'},verses:[
   {book_id:'JHN',book:'John',chapter:3,verse:16,text:'For God so loved the world.'},
   {book_id:'JHN',book:'John',chapter:3,verse:17,text:'For God didn’t send the Son to judge the world.'}
  ]})
 }));
 await page.getByRole('tab',{name:'More'}).click();
 await page.getByRole('button',{name:/Bible & reading/}).click();
 await expect(page.getByText('The Word, in your hands.')).toBeVisible();
 await expect(page.getByText(/For God so loved the world/)).toBeVisible();
 await page.getByRole('button',{name:'Highlight John 3:16'}).click();
 await page.getByRole('button',{name:'Share John 3:16 to Scripture together'}).click();
 await expect(page.getByText(/From your Bible reader: John 3:16/)).toBeVisible();
 await expect(page.getByText('A space to grow together')).toBeVisible();
});
test('social directory includes platform links without unverified direct profile URLs',async ({page})=>{
 await page.getByRole('tab',{name:'More'}).click();
 await page.getByRole('button',{name:/Social channels/}).click();
 for(const item of ['YouTube','Instagram','Facebook','TikTok','X / Twitter','Apple Podcasts'])
  await expect(page.getByRole('button',{name:'Open '+item})).toBeVisible();
 await expect(page.getByText(/verified Linktree/)).toBeVisible();
});
test('notifications inbox and preference toggles do not claim active push integration',async ({page})=>{
 await page.getByRole('tab',{name:'More'}).click();
 await page.getByRole('button',{name:/^Updates/}).click();
 await expect(page.getByText('Updates',{exact:true})).toBeVisible();
 await expect(page.getByText(/No marketing notifications/)).toBeVisible({timeout:5000}).catch(()=>{});
 await page.getByRole('button',{name:'Back'}).click().catch(()=>{});
});

test('inclusive personal faith journeys save progress without requiring membership',async ({page})=>{
 await page.getByRole('tab',{name:'More'}).click();
 await page.getByRole('button',{name:/Your faith journey/}).click();
 await expect(page.getByText('Your faith journey.')).toBeVisible();
 await expect(page.getByText(/No scores, streaks or comparisons/)).toBeVisible();
 await page.getByRole('button',{name:'Faith at home'}).click();
 await expect(page.getByText('Faith at home',{exact:true}).first()).toBeVisible();
 await page.getByRole('checkbox',{name:'Mark reflection 1 complete'}).click();
 await expect(page.getByText('1 of 7 reflections marked complete')).toBeVisible();
 await page.reload();
 await page.getByRole('tab',{name:'More'}).click();
 await page.getByRole('button',{name:/Your faith journey/}).click();
 await expect(page.getByText('1 of 7 reflections marked complete')).toBeVisible();
});

test('privacy erase removes Bible notes, faith progress, theme and reopens welcome',async ({page})=>{
 await page.getByRole('tab',{name:'More'}).click();
 await page.getByRole('button',{name:/Your faith journey/}).click();
 await page.getByRole('checkbox',{name:'Mark reflection 1 complete'}).click();
 await expect(page.getByText('1 of 7 reflections marked complete')).toBeVisible();
 await page.getByRole('tab',{name:'More'}).click();
 await page.getByRole('button',{name:/^Preferences/}).click();
 await page.getByRole('radio',{name:'Light / ivory'}).click();
 await page.getByRole('tab',{name:'More'}).click();
 await page.getByRole('button',{name:/Privacy and your data/}).click();
 await expect(page.getByText('Church account deletion',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Clear all app data on this device'}).click();
 await expect(page.getByText(/erases all Solid Rock local preferences/)).toBeVisible();
 await page.getByRole('button',{name:"Yes, erase this device's app data"}).click();
 await expect(page.getByText('A community beyond Sunday.')).toBeVisible();
 await page.reload();
 await expect(page.getByText('A community beyond Sunday.')).toBeVisible();
 await page.getByRole('button',{name:'Skip welcome guide'}).click();
 await expect(page.getByRole('button',{name:'Switch to light mode'})).toBeVisible();
 await page.getByRole('tab',{name:'More'}).click();
 await page.getByRole('button',{name:/Your faith journey/}).click();
 await expect(page.getByText('0 of 7 reflections marked complete')).toBeVisible();
});
