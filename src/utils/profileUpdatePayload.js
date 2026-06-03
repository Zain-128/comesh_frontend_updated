import { normalizeNicheForApi } from './onboardingApiDebug';

/** Ensure questionAndAnswers is an array of { question, answer } for JSON PUT. */
export function normalizeQuestionAndAnswersForApi(qa) {
  if (qa == null || qa === '') {
    return undefined;
  }
  if (typeof qa === 'string') {
    const t = qa.trim();
    if (!t) return undefined;
    try {
      const parsed = JSON.parse(t);
      return normalizeQuestionAndAnswersForApi(parsed);
    } catch {
      return undefined;
    }
  }
  if (!Array.isArray(qa)) {
    return undefined;
  }
  return qa
    .map((item) => {
      if (item == null || typeof item !== 'object') {
        return null;
      }
      const question = item.question ?? item.Q;
      const answer = item.answer ?? item.selected ?? item.A;
      if (question == null || answer == null) {
        return null;
      }
      return { question: String(question), answer: String(answer) };
    })
    .filter(Boolean);
}

/**
 * Whitelist profile fields for PUT /users/updateProfile (JSON body).
 * Avoids spreading Redux noise and keeps niche / Q&A as real arrays.
 */
export function buildProfileUpdatePayload(source = {}, overrides = {}) {
  const merged = { ...source, ...overrides };
  const payload = {};

  const scalarKeys = [
    'firstName',
    'lastName',
    'dob',
    'address',
    'email',
    'pronouns',
    'description',
    'willingToTravel',
    'showLocation',
    'followers',
    'isFirstTime',
    'deviceToken',
    'availabilityFrom',
    'availabilityTo',
    'timeZone',
    'emptyVideos',
  ];

  scalarKeys.forEach((key) => {
    if (merged[key] !== undefined && merged[key] !== null) {
      payload[key] = merged[key];
    }
  });

  if (payload.followers !== undefined && payload.followers !== null) {
    const n = Number(payload.followers);
    payload.followers = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  }

  if (merged.email != null) {
    payload.email = String(merged.email).replace(/\s/g, '');
  }

  if (merged.socialMediaProfiles != null) {
    payload.socialMediaProfiles = merged.socialMediaProfiles;
  }

  const niche = normalizeNicheForApi(merged.niche);
  if (niche?.length) {
    payload.niche = niche;
  }

  const questionAndAnswers = normalizeQuestionAndAnswersForApi(
    merged.questionAndAnswers,
  );
  if (questionAndAnswers?.length) {
    payload.questionAndAnswers = questionAndAnswers;
  }

  if (Array.isArray(merged.previousVideos)) {
    payload.previousVideos = merged.previousVideos;
  } else if (merged.previousVideos != null && !merged._skipPreviousVideos) {
    const pv = merged.previousVideos;
    if (typeof pv === 'string') {
      try {
        const parsed = JSON.parse(pv);
        if (Array.isArray(parsed)) {
          payload.previousVideos = parsed;
        }
      } catch {
        /* ignore */
      }
    }
  }

  return payload;
}
