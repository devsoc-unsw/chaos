export async function uploadFile(putUrl: string, file: File): Promise<void> {
    const headers: HeadersInit = {};
    if (file.type) {
        headers["Content-Type"] = file.type;
    }

    const res = await fetch(putUrl, {
        method: "PUT",
        headers,
        body: file,
    });

    if (!res.ok) {
        throw new Error(`Upload failed (${res.status} ${res.statusText})`);
    }
}
