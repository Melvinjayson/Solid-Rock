const {test}=require('node:test');
const assert=require('node:assert/strict');
const {isSixDigitOtp,normalizeEmail}=require('../src/authValidation');
test('valid six-digit email OTPs are accepted',()=>{
  for(const value of ['000000','123456','987654',' 123456 ']) assert.equal(isSixDigitOtp(value),true,value);
});
test('malformed, incomplete and injected OTPs are rejected',()=>{
  for(const value of ['12345','1234567','abcdef','\\d{6}','123 456','١٢٣٤٥٦','123456\n7',null,undefined,123456])
    assert.equal(isSixDigitOtp(value),false,String(value));
});
test('email is normalised and syntactically bounded',()=>{
  assert.equal(normalizeEmail(' MEMBER@EXAMPLE.ORG '),'member@example.org');
  for(const value of ['not-an-email','a@b',null,'a @example.com','x'.repeat(255)+'@example.org'])assert.equal(normalizeEmail(value),null);
});
