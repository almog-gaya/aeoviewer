export const handleRedditLogin = async () => {

    window.location.href = "/api/auth/reddit/login";

};
export const getRedditUser = async () => {
    try {
        const response = await fetch("/api/reddit-user", {
            credentials: "include",
        });
        return await response.json();
    } catch (err) {
        console.error("Failed to fetch Reddit user:", err);
    }
};

export const handleRedditLogout = async () => {
    await fetch("/api/auth/reddit/logout", { method: "POST", credentials: "include" });
    window.location.reload();
};

