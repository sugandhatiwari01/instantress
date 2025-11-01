// linkedinAuth.js
const passport = require('passport');
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

const setupLinkedInStrategy = () => {
  passport.use(
    new LinkedInStrategy(
      {
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: "http://localhost:4000/auth/linkedin/callback",
        scope: ['r_liteprofile', 'r_primarycontact'],  // <-- Updated: r_primarycontact for email + phone
        state: true
      },
      async (accessToken, _refreshToken, profile, done) => {
        // Get phone/email via Primary Contact API
        let primaryContact = null;
        try {
          const contactRes = await require('axios').get(
            'https://api.linkedin.com/v2/clientAwareMemberHandles?q=members&projection=(elements*(primary,type,handle~))',
            { headers: { Authorization: `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' } }
          );
          primaryContact = contactRes.data.elements[0]?.['handle~'] || {};
        } catch (e) {
          console.warn('Primary contact fetch failed:', e.message);
        }

        const user = {
          id: profile.id,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          profileUrl: profile._json.publicProfileUrl,
          email: primaryContact.emailAddress || '',  // From handle~
          phone: primaryContact.phoneNumber?.number || '',  // Primary phone if set
          headline: profile._json.localizedHeadline || '',
          pictureUrl: profile.photos?.[0]?.value || null,
          accessToken,
        };
        return done(null, user);
      }
    )
  );
};

module.exports = { passport, setupLinkedInStrategy };