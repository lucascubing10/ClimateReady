import fetch from 'node-fetch';


const LABELS = ['climate misinformation', 'spam', 'harmful', 'safe'];


export async function moderateText(text) {
// quick rules first
const low = text.toLowerCase();
if (low.includes('buy now') || low.includes('free money') || low.includes('whatsapp number')) {
return { approved: false, reason: 'Likely spam (rule-based)', scores: { spam: 0.99 } };
}


// optional: HF zero-shot (free tier). If token missing, approve by default.
const token = process.env.HF_API_TOKEN;
if (!token) return { approved: true, reason: 'Approved (no HF token)', scores: {} };


try {
const res = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-mnli', {
method: 'POST',
headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
body: JSON.stringify({ inputs: text, parameters: { candidate_labels: LABELS } })
});
const data = await res.json();
const scores = Object.fromEntries(data.labels.map((l, i) => [l, data.scores[i]]));


// reject if spam/harmful are very likely
if ((scores['spam'] ?? 0) > 0.6 || (scores['harmful'] ?? 0) > 0.6) {
return { approved: false, reason: 'Rejected by AI moderation', scores };
}


// allow; you could flag as pending if "misinformation" score is high
const approved = (scores['safe'] ?? 0) >= 0.5 || ((scores['spam'] ?? 0) < 0.4 && (scores['harmful'] ?? 0) < 0.4);
return { approved, reason: approved ? 'Approved' : 'Pending review', scores };
} catch (e) {
console.error('HF moderation failed:', e.message);
return { approved: true, reason: 'Approved (HF error fallback)', scores: {} };
}
}