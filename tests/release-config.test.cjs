const {test}=require('node:test');
const assert=require('node:assert/strict');
const config=require('../app.config.js');
function withEnvironment(env,fn){
 const keys=Object.keys(env),previous=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 for(const k of keys){if(env[k]===undefined)delete process.env[k];else process.env[k]=env[k];}
 try{return fn();}finally{for(const k of keys){if(previous[k]===undefined)delete process.env[k];else process.env[k]=previous[k];}}
}
const base={EAS_BUILD_PROFILE:'production',SOLID_ROCK_STORE_RELEASE_APPROVED:'true',
 SOLID_ROCK_ANDROID_PACKAGE:'org.solidrock.dublin',SOLID_ROCK_IOS_BUNDLE_ID:'org.solidrock.dublin',
 EXPO_PUBLIC_CHURCH_BACKEND_ENABLED:'true',EXPO_PUBLIC_MEMBER_SIGNUP_ENABLED:'true'};
test('production rejects member sign-up without approved account deletion and safeguarding',()=>{
 withEnvironment({...base,SOLID_ROCK_ACCOUNT_DELETION_VERIFIED:undefined,
  SOLID_ROCK_PRIVACY_APPROVED:undefined,SOLID_ROCK_SAFEGUARDING_APPROVED:undefined},
  ()=>assert.throws(()=>config({config:{}}),/Production member signup requires/));
});
test('production still requires church-approved store identities',()=>{
 withEnvironment({...base,EXPO_PUBLIC_CHURCH_BACKEND_ENABLED:'false',EXPO_PUBLIC_MEMBER_SIGNUP_ENABLED:'false',
 SOLID_ROCK_STORE_RELEASE_APPROVED:undefined},()=>assert.throws(()=>config({config:{}}),/Production app signing/));
});
test('preview builds do not inherit protected production identity',()=>{
 withEnvironment({EAS_BUILD_PROFILE:'preview',EXPO_PUBLIC_MEMBER_SIGNUP_ENABLED:'false'},()=>{
  const result=config({config:{}});
  assert.ok(result.android.package.endsWith('.preview'));
  assert.notEqual(result.extra?.environment,'production');
 });
});
