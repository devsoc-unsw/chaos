use axum::response::{IntoResponse, Response};
use aide::OperationOutput;
use aide:: gen;
use aide::openapi::Operation;
use axum::http::StatusCode;


pub struct Response200<const MSG: &'static str> {}

/// Implementation for converting errors into responses. Manages error code and message returned.
impl<const MSG: &'static str> IntoResponse for Response200<MSG> {
    fn into_response(self) -> Response {
		(StatusCode::OK, MSG).into_response()
    }
}

impl<const MSG: &'static str> OperationOutput for Response200<MSG> {
	type Inner = Self;

    fn inferred_responses(
        ctx: &mut gen::GenContext,
        operation: &mut Operation,
    ) -> Vec<(Option<u16>, aide::openapi::Response)> {
		Vec::from([
			(Some(200), aide::openapi::Response {
				description: MSG.to_string(),
				..Default::default()
			})
		])
    }
}
