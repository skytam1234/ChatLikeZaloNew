import passport from 'passport';
import { Strategy as GoogleOAuth2Strategy } from 'passport-google-oauth20';
import { v4 as uuidv4 } from 'uuid';
import config from './index.js';
import prisma from './prisma.js';
import { generateTokens, getTokenExpiration } from '../utils/jwt.js';
import { GOOGLE_ONLY_PASSWORD_MARKER } from '../controllers/auth/google.controller.js';

const GOOGLE_SCOPES = ['profile', 'email'];

/**
 * Serialize user to session (store user ID only)
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * Deserialize user from session (restore full user)
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        isVerified: true,
        isActive: true,
        googleId: true,
        createdAt: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

/**
 * Create or get a session for a user
 */
async function createGoogleSession(userId, deviceInfo = {}) {
  const tokens = generateTokens(userId);

  await prisma.session.create({
    data: {
      id: uuidv4(),
      userId,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: getTokenExpiration(config.jwtExpiresIn),
      refreshExpiresAt: getTokenExpiration(config.jwtRefreshExpiresIn),
      deviceInfo: JSON.stringify({
        type: 'google-oauth',
        ...deviceInfo,
      }),
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { status: 'online', lastSeenAt: new Date() },
  });

  return tokens;
}

/**
 * Configure Google OAuth2 Strategy
 */
export function configureGoogleStrategy() {
  passport.use(
    'google',
    new GoogleOAuth2Strategy(
      {
        clientID: config.google.clientID,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackURL,
        scope: GOOGLE_SCOPES,
        passReqToCallback: false,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            profile.emails && profile.emails.length > 0
              ? profile.emails[0].value
              : null;

          if (!email) {
            return done(new Error('Google account does not have a verified email'), null);
          }

          // --- 1. Check if user already has this googleId linked ---
          const existingByGoogleId = await prisma.user.findFirst({
            where: { googleId: profile.id },
          });

          if (existingByGoogleId) {
            // Login normally
            const tokens = await createGoogleSession(existingByGoogleId.id);
            return done(null, { ...existingByGoogleId, tokens });
          }

          // --- 2. Check if email already exists ---
          const existingByEmail = await prisma.user.findUnique({
            where: { email },
          });

          if (existingByEmail) {
            // Account linking: link Google to existing account
            if (existingByEmail.googleId && existingByEmail.googleId !== profile.id) {
              return done(
                new Error('This Google account is already linked to another user'),
                null
              );
            }

            const updatedUser = await prisma.user.update({
              where: { id: existingByEmail.id },
              data: {
                googleId: profile.id,
                googleAccessToken: accessToken,
                googleRefreshToken: refreshToken || null,
                avatarUrl: profile.photos?.[0]?.value || existingByEmail.avatarUrl,
                isVerified: true,
              },
              select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                status: true,
                isVerified: true,
                isActive: true,
                googleId: true,
                createdAt: true,
              },
            });

            const tokens = await createGoogleSession(updatedUser.id);
            return done(null, { ...updatedUser, tokens });
          }

          // --- 3. Auto-register: create new user ---
          const displayName =
            profile.displayName ||
            profile.name?.givenName + ' ' + profile.name?.familyName ||
            email.split('@')[0];

          const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
          let username = baseUsername;
          let counter = 1;

          // Ensure username uniqueness
          while (await prisma.user.findUnique({ where: { username } })) {
            username = `${baseUsername}${counter}`;
            counter++;
          }

          const newUser = await prisma.user.create({
            data: {
              id: uuidv4(),
              username,
              email,
              passwordHash: GOOGLE_ONLY_PASSWORD_MARKER, // cannot login with password
              displayName,
              avatarUrl: profile.photos?.[0]?.value || null,
              isVerified: true, // Google email is pre-verified
              isActive: true,
              status: 'online',
              googleId: profile.id,
              googleAccessToken: accessToken,
              googleRefreshToken: refreshToken || null,
              lastSeenAt: new Date(),
            },
            select: {
              id: true,
              email: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              status: true,
              isVerified: true,
              isActive: true,
              googleId: true,
              createdAt: true,
            },
          });

          const tokens = await createGoogleSession(newUser.id);
          return done(null, { ...newUser, tokens });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

export { passport };
export default passport;
