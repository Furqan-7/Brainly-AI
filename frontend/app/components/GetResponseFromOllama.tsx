import axios from "axios";

export async function GetResponseFromOllama(
    text: string,
    token: string
) {
    try {
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

    } catch (err) {
        console.error(err);
        return "Something went wrong";
    }
}