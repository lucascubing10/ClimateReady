// server/src/services/aiModeration.js
// Hugging Face toxicity moderation wrapper.
// Requires env: HUGGINGFACE_API_KEY

import fetch from 'node-fetch';

const MODEL = process.env.HF_MODERATION_MODEL || 'unitary/toxic-bert';
const ENDPOINT = `https://api-inference.huggingface.co/models/${MODEL}`;

export async function aiModerate(text) {
  const key = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_TOKEN; // allow either var name
  if (!key) {
    return { allowed: true, reason: 'no_key', scores: {}, model: MODEL };
  }
  if (!text || !text.trim()) return { allowed: true, reason: 'empty', scores: {}, model: MODEL };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ inputs: text.slice(0, 4000) }),
      signal: controller.signal
    });

    if (!res.ok) {
      return { allowed: true, reason: `hf_${res.status}`, scores: {}, model: MODEL };
    }
    const data = await res.json();
    // Expect shape: [ [ { label, score }, ... ] ]
    const entries = Array.isArray(data) ? data.flat() : [];
    const scores = {};
    for (const item of entries) {
      if (item && item.label) scores[item.label.toLowerCase()] = item.score;
    }

    const toxic = scores.toxic || 0;
    const severe = toxic >= 0.85;
    return {
      allowed: !severe,
      blocked: severe,
      reason: severe ? 'toxic_high' : 'ok',
      scores,
      model: MODEL
    };
  } catch (e) {
    return { allowed: true, reason: 'hf_error', error: e.message, scores: {}, model: MODEL };
  } finally {
    clearTimeout(timeout);
  }
}

// Compose AI + existing rule-based moderation
import { moderateText } from '../moderation.js';
export async function compositeModerate(text) {
  // First run existing rule based (spam etc.)
  const rule = await moderateText(text);
  const ai = await aiModerate(text);

  // If either blocks, block.
  const blocked = (!rule.approved) || ai.blocked === true;
  const approved = !blocked;

  return {
    approved,
    blocked,
    reason: !approved ? (ai.blocked ? ai.reason : rule.reason) : 'Approved',
    rule,
    ai
  };
}
