export async function uploadFile(putUrl: string, file: File): Promise<void> {
    await fetch(putUrl, {
        method: "PUT",
        headers: {
            "Content-Type": file.type,
        },
        body: file,
    });
}