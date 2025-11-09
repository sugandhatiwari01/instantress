// linkedinAuth.js - FIXED VERSION
const passport = require('passport');
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const axios = require('axios');

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

const setupLinkedInStrategy = () => {
  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
    console.error('❌ LinkedIn credentials missing! Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET');
    return;
  }

  passport.use(
    new LinkedInStrategy(
      {
clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: "http://localhost:4000/auth/linkedin/callback",
  scope: ['openid', 'profile', 'email'],
  state: true
},
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('✓ LinkedIn OAuth successful, fetching additional data...');
          
          // Fetch email using OpenID Connect endpoint
          let email = '';
          try {
            const emailRes = await axios.get(
              'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
              { 
                headers: { 
                  'Authorization': `Bearer ${accessToken}`,
                  'X-Restli-Protocol-Version': '2.0.0'
                },
                timeout: 10000
              }
            );
            email = emailRes.data?.elements?.[0]?.['handle~']?.emailAddress || '';
          } catch (e) {
            console.warn('⚠ Email fetch failed:', e.message);
          }

          // Fetch primary phone (if available via r_basicprofile)
          let phone = '';
          try {
            const phoneRes = await axios.get(
              'https://api.linkedin.com/v2/clientAwareMemberHandles?q=members&projection=(elements*(primary,type,handle~))',
              { 
                headers: { 
                  'Authorization': `Bearer ${accessToken}`,
                  'X-Restli-Protocol-Version': '2.0.0'
                },
                timeout: 10000
              }
            );
            const phoneElement = phoneRes.data?.elements?.find(el => el.type === 'PHONE');
            phone = phoneElement?.['handle~']?.phoneNumber?.number || '';
          } catch (e) {
            console.warn('⚠ Phone fetch failed (may not be authorized):', e.message);
          }

          // Fetch work experience using profile endpoint
          let experience = [];
          try {
      // In linkedinAuth.js callback
const expRes = await axios.get(
  'https://api.linkedin.com/v2/positions?$expand=company&projection=(elements*(title,company~(name,logoUrl),startDate,endDate,description,location))',
  { headers: { Authorization: `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' } }
);
            
            const positions = expRes.data?.positions?.elements || [];
            experience = positions.map(pos => ({
              title: pos.title || '',
              company: pos['company~']?.name || '',
              startDate: pos.startDate ? `${pos.startDate.year}-${pos.startDate.month || '01'}` : '',
              endDate: pos.endDate ? `${pos.endDate.year}-${pos.endDate.month || '01'}` : 'Present',
              description: ''
            }));
          } catch (e) {
            console.warn('⚠ Experience fetch failed:', e.message);
          }

          const user = {
            id: profile.id,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            profileUrl: profile._json?.publicProfileUrl || `https://linkedin.com/in/${profile.id}`,
            email: email,
            phone: phone,
            headline: profile._json?.localizedHeadline || profile._json?.headline || '',
            pictureUrl: profile.photos?.[0]?.value || null,
            experience: experience,
            accessToken: accessToken,
            refreshToken: refreshToken
          };

          console.log('✓ LinkedIn user data prepared:', {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            phone: user.phone,
            experienceCount: user.experience.length
          });

          return done(null, user);
        } catch (error) {
          console.error('❌ LinkedIn profile processing error:', error.message);
          return done(error, null);
        }
      }
    )
  );

  console.log('✓ LinkedIn OAuth strategy initialized');
};

module.exports = { passport, setupLinkedInStrategy };