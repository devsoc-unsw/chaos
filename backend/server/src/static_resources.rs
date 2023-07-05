use std::path::{Path, PathBuf};

use rocket::{
    fs::NamedFile,
    get,
    response::{self, Responder},
    Request, Response,
};

pub struct CachedFile(NamedFile);

impl<'r> Responder<'r, 'r> for CachedFile {
    fn respond_to(self, req: &Request) -> response::Result<'r> {
        Response::build_from(self.0.respond_to(req)?)
            .raw_header("Cache-control", "max-age=86400") //  24h (24*60*60)
            .ok()
    }
}

#[get("/images/<file..>")]
pub async fn files(file: PathBuf) -> Option<CachedFile> {
    NamedFile::open(Path::new("images/").join(file))
        .await
        .ok()
        .map(|nf| CachedFile(nf))
}
