const BASE = '/api';

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.json();
}

export const fetchState     = ()             => req('GET',    '/state');
export const createBet      = (data)         => req('POST',   '/bets', data);
export const resolveBet     = (id, outcome)  => req('PATCH',  `/bets/${id}/resolve`, { outcome });
export const counterBet     = (betId, cb)    => req('POST',   `/bets/${betId}/counter`, cb);
export const flameBet       = (id)           => req('PATCH',  `/bets/${id}/flame`);
export const updateProfile  = (user, data)   => req('PUT',    `/profiles/${user}`, data);
export const resetCredits   = (amounts)      => req('PUT',    '/credits', amounts);
export const createCategory = (cat)          => req('POST',   '/categories', cat);
export const deleteCategory = (id)           => req('DELETE', `/categories/${id}`);
