export const CHURCH_URL = 'https://solidrockdublin.org/';
export const CHURCH_NAME = 'Solid Rock Dublin';
export const INTRO = 'Loving God, loving others and serving the world.';
export const CONTACT_EMAIL = 'admin@solidrockdublin.org';
export const CONTACT_ADDRESS = 'Goldenbridge Industrial Estate, 6B, Inchicore, Dublin 8';
export const SUNDAY_SERVICE = 'Sunday worship · 11:00 am';
export const VISIT_URL = 'https://solidrockdublin.org/plan-a-visit/';
export const MINISTRIES = [
  {name:'Food Bank',detail:'Providing practical support, food and a place of belonging.',url:'https://solidrockdublin.org/our-mission/',image:'foodBank'},
  {name:'Youth Sunday School',detail:'Helping young people grow in faith and friendship.',url:'https://solidrockdublin.org/services/youth-sunday-school/',image:'sundaySchool'},
  {name:'Spirituality',detail:'Prayer, reflection and growing in faith together.',url:'https://solidrockdublin.org/services/spirituality/',image:'spirituality'},
] as const;

// Official website content snapshot, checked 8 November 2026.
// No fabricated calendar dates or staff identities should be introduced.
export const sampleEvents = [
  {id:'sunday-service',day:'SUN',date:'11 AM',title:'Sunday worship',detail:'Goldenbridge Industrial Estate, Inchicore, Dublin 8',label:'Confirmed weekly service'},
];
export const sampleMessages = [
  {id:'grace',series:'REFLECTION GUIDE',title:'Grace for everyday life',description:'Reflect on Ephesians 2:8–10 and the gift of grace.',passage:'Ephesians 2:8–10'},
  {id:'faith',series:'REFLECTION GUIDE',title:'Rooted in faith',description:'Explore how faith shapes the choices we make.',passage:'Colossians 2:6–7'},
];
// Reflection guides are authored app content, not sermons by church leaders.
