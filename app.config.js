// Safe build identities: preview must never impersonate the published ChMeetings app.
// Production identity is supplied only after church ownership and signing verification.
const base = require('./app.json').expo;
module.exports = ({config}) => {
  const profile = process.env.EAS_BUILD_PROFILE || 'preview';
  const result = {...base, ...config, ios:{...base.ios,...config.ios},android:{...base.android,...config.android}};
  if(profile === 'production') {
    // A public native binary must not enable member signup before its privacy,
    // account deletion and safeguarding release gates are accepted.
    if(process.env.EXPO_PUBLIC_CHURCH_BACKEND_ENABLED==='true' &&
       process.env.EXPO_PUBLIC_MEMBER_SIGNUP_ENABLED==='true' &&
       (process.env.SOLID_ROCK_ACCOUNT_DELETION_VERIFIED!=='true' ||
        process.env.SOLID_ROCK_PRIVACY_APPROVED!=='true' ||
        process.env.SOLID_ROCK_SAFEGUARDING_APPROVED!=='true')){
      throw new Error('Production member signup requires church-approved account deletion, privacy and safeguarding gates.');
    }
    const android = process.env.SOLID_ROCK_ANDROID_PACKAGE;
    const ios = process.env.SOLID_ROCK_IOS_BUNDLE_ID;
    const valid = id => typeof id==='string' && /^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*){2,}$/.test(id) && !id.endsWith('.preview');
    if(process.env.SOLID_ROCK_STORE_RELEASE_APPROVED!=='true' || !valid(android)||!valid(ios)) {
      throw new Error('Production app signing and church-approved Android/iOS identifiers must be verified first.');
    }
    result.name='Solid Rock Centre';result.ios.bundleIdentifier=ios;result.android.package=android;
    result.extra={...result.extra,environment:'production'};
  }
  return result;
};
