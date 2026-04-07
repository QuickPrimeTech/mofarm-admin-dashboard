import axios from "axios";

export async function revalidatePage(path: string) {
  try {
    const revalidateEndpoint = process.env.STORE_URL;
    const revalidateSecret = process.env.REVALIDATE_KEY;

    if (!revalidateSecret) {
      console.error("Missing REVALIDATE_SECRET.");
      return null;
    }

    // ✅ Axios call (correct)
    const res = await axios.post(
      `${revalidateEndpoint}/api/revalidate`,
      {
        path,
        secret: revalidateSecret,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    return res.data;
  } catch (err: any) {
    console.log(err);
    // 🔥 THIS logs the error returned from the other site's API
    if (axios.isAxiosError(err)) {
      console.error("Revalidation API Error:");
      console.error("Response:", JSON.stringify(err.response?.data));
    } else {
      console.error("Unexpected error:", JSON.stringify(err));
    }

    return null;
  }
}
