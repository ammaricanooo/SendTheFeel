import axios from "axios";

const client_id = "acc6302297e040aeb6e4ac1fbdfd62c3";
const client_secret = "0e8439a1280a43aba9a5bc0a16f3f009";
const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

async function spotifyCreds() {
    try {
        const response = await axios.post(
            TOKEN_ENDPOINT,
            "grant_type=client_credentials",
            {
                headers: {
                    Authorization: "Basic " + basic,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
            },
        );
        return {
            status: true,
            data: response.data,
        };
    } catch (error) {
        return { status: false, msg: "Failed to retrieve Spotify credentials." };
    }
}

const toTime = (ms) => {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
};

class Spotify {
    search = async (query, type = "track", limit = 5) => {
        try {
            const creds = await spotifyCreds();
            if (!creds.status) return creds;

            const response = await axios.get(
                `https://api.spotify.com/v1/search?query=${encodeURIComponent(query)}&type=${type}&offset=0&limit=${limit}`,
                {
                    headers: { Authorization: "Bearer " + creds.data.access_token },
                },
            );

            if (!response.data[type + "s"] || !response.data[type + "s"].items.length) {
                return {
                    success: false,
                    code: 404,
                    result: { error: "Music not found!" },
                };
            }

            return {
                success: true,
                code: 200,
                result: response.data[type + "s"].items,
            };

        } catch (error) {
            return {
                status: false,
                code: 500,
                msg: "Error searching for music. " + error.message,
            };
        }
    };
}

export default Spotify;
