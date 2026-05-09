import axios from "axios";

export async function GetResponseFromOllama(
    text: string,
    token: string
) {
    // Let errors propagate — ChatComponent handles them
    const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/api/chat`,
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
}