export const opportunityFields = [
  "title",
  "description",
  "research_area",
  "faculty_name",
  "department",
  "required_skills",
  "available_positions",
  "application_deadline",
  "status",
];

export function opportunityPayload(record) {
  return Object.fromEntries(
    opportunityFields.map((field) => [field, record[field]]),
  );
}

export class ApiError extends Error {
  constructor(message, errors = {}) {
    super(message);
    this.errors = errors;
  }
}

async function request(path = "", options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`/api/opportunities${path}`, {
      ...options,
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    const body = await response.json();
    if (!response.ok)
      throw new ApiError(body.message || "The request failed.", body.errors);
    return body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Cannot reach the server. Check that the Python backend and MySQL are running.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  list: () => request(),
  get: (id) => request(`/${id}`),
  create: (data) => request("", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => request(`/${id}`, { method: "DELETE" }),
};
