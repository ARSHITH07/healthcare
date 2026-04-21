const PROFILE_KEY = "healthchain-profile";

const defaultProfile = {
  name: "",
  email: "",
  role: "Clinician",
};

export function getStoredProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...defaultProfile };
    const parsed = JSON.parse(raw);
    return { ...defaultProfile, ...parsed };
  } catch {
    return { ...defaultProfile };
  }
}

export function saveStoredProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
