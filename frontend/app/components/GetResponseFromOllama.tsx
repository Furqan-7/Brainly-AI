import axios from "axios";

export async function GetResponseFromOllama(
    text: string,
    token: string
) {
    try {
        const res = await axios.post(
            "http://localhost:3001/api/chat",
            {
                question: text,
            },
            {
                headers: {
                    token,
                },
            }
        );

        return res.data;

    } catch (err) {
        console.error(err);
        return "Something went wrong";
    }
}