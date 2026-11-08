/**
 * Verified public church information (checked 2026-11-08).
 * Sources:
 * https://solidrockdublin.org/give
 * https://solidrockdublin.org/contacts
 * https://linktr.ee/solidrockcentre
 * Publisher/finance owner must reapprove payment details before live launch.
 */
export const GIVING={
 source:'https://solidrockdublin.org/give',
 iban:'IE23 BOFI 9033 6590 5850 99',
 paypal:'https://www.paypal.com/paypalme/solidrockcentre',
 // Do NOT invent account name, BIC, donation fund, receipt, or card payment processor.
 cardProviderApproved:false
} as const;
export const CONTACT={
 name:'Solid Rock Dublin',
 email:'admin@solidrockdublin.org',
 phone:'+35314549788',
 phoneAlt:'+35315524727',
 address:'Goldenbridge Industrial Estate, 6B, Inchicore, Dublin 8',
 website:'https://solidrockdublin.org/',
 visit:'https://solidrockdublin.org/plan-a-visit'
} as const;
export type ChannelLink={name:string;url:string;kind:'profile'|'directory'|'audio';description:string};
export const OFFICIAL_CHANNELS:ChannelLink[]=[
 {name:'YouTube',url:'https://www.youtube.com/@solidrockcentre',kind:'profile',description:'Live worship, messages and clips'},
 {name:'Instagram',url:'https://www.instagram.com/solidrockcentre/',kind:'profile',description:'Reels, stories and community updates'},
 {name:'Facebook',url:'https://linktr.ee/solidrockcentre',kind:'directory',description:'Find the church Facebook page via its verified directory'},
 {name:'TikTok',url:'https://linktr.ee/solidrockcentre',kind:'directory',description:'Find the church TikTok via its verified directory'},
 {name:'X / Twitter',url:'https://linktr.ee/solidrockcentre',kind:'directory',description:'Find the church X profile via its verified directory'},
 {name:'Apple Podcasts',url:'https://podcasts.apple.com/ie/podcast/solid-rock-centre-dublin/id1694585639',kind:'audio',description:'Listen to church messages'},
];
export const GIVE_REVIEW_NOTE='These details are published by the church. Confirm the beneficiary with the church before sending money. Bank transfers are completed in your own banking app; PayPal payment options vary by country and account.';
